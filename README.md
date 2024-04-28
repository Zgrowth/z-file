# z-file
将文件上传到仓库

### 思路

1. 使用`Github Pages`的静态站点托管服务生成一个网站，这个网站只有简单的功能，上传文件到中转站。
2. 这个中转站就是暂时存储文件，我们使用`Leancloud`的能力，提供开放api支持存储。
3. 使用`Github Actions`能力，每日定时获取中转站的文件，然后上传到当前仓库下。

### 步骤
1. 创建[leancloud](https://console.leancloud.cn/)账号，然后创建一个应用，拿到appId和appKey。根据[文档](https://docs.leancloud.cn/sdk/storage/guide/js/#%E4%BF%9D%E5%AD%98%E6%96%87%E4%BB%B6)可以看到，`Leancloud`提供了`js`的sdk，我们使用这个sdk来操作文件,实现思路中的步骤1和步骤2。示例如下
```html
<script>
  // 初始化 LeanCloud 应用
  AV.init({
    appId: "appId", // 替换为你的 App ID
    appKey: "appKey", // 替换为你的 App Key
    serverURL: "https://cn-n1-console-api.leancloud.cn", // 替换为你的 Server URL
  });

  // 文件上传函数
  async function uploadFile(fileInput) {
    if (fileInput.files.length > 0) {
      showLoading();
      try {
        const results = await uploadFilesSequentially(fileInput.files);
        console.log("All files uploaded:", results);
        const errResults = results.filter((i) => i.status === "error");
        if (errResults.length > 0) {
          alert(
            "部分文件上传失败：" +
              errResults.map((i) => i.message).join(", ")
          );
        }
        hideLoading();
      } catch (error) {
        hideLoading();
        console.error(
          "An error occurred during the file upload process:",
          error
        );
      }
    }
  }

  // 异步函数，逐个上传文件
  async function uploadFilesSequentially(fileList) {
    const uploadedFiles = [];

    for (let i = 0; i < fileList.length; i++) {
      try {
        const file = fileList[i];
        if (file.size >= 20 * 1024 * 1024) {
          uploadedFiles.push({
            status: "error",
            name: file.name,
            message: "文件大小超过限制",
          });
          continue;
        }
        const avFile = new AV.File(file.name, file);
        const uploadedFile = await avFile.save({
          onprogress: (progress) => {
            console.log(progress);
            setLoadingProgress(progress.percent, i + 1, fileList.length);
          },
        }); // 等待文件上传完成
        uploadedFiles.push(uploadedFile); // 将上传后的文件加入结果数组
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // 可以根据需要决定是停止上传还是继续尝试上传其余文件
        // break; // 停止上传
        // continue; // 跳过当前文件，继续下一个文件
        uploadedFiles.push({
          status: "error",
          name: file.name,
          message: error || error.message,
        });
      }
    }

    return uploadedFiles;
  }

  // 设置loading文案
  function setLoadingProgress(num, idx, len) {
    document.getElementById(
      "loading"
    ).innerText = `正在上传${idx}/${len}文件...(${parseFloat(num).toFixed(
      2
    )}%)`;
  }

  // 显示 loading 动画
  function showLoading() {
    document.getElementById("loading").style.display = "block";
  }

  // 隐藏 loading 动画
  function hideLoading() {
    document.getElementById("loading").style.display = "none";
  }

  // 手动触发文件选择框
  function triggerFileInput() {
    document.getElementById("file-input").click();
  }
</script>
<body>
  <h1>上传至github仓库</h1>
  <div class="upload-container">
    <label for="file-input" class="custom-file-upload"> 选择文件 </label>
    <input type="file" id="file-input" onchange="uploadFile(this)" multiple />
  </div>
  <div id="loading">Loading...</div>
</body>
```

2. 创建一个js文件，用于读取leancloud中转站的文件，然后将文件上传到github仓库。
> tips：需要在当前目录下创建downloaded文件夹
```js
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const AV = require("leancloud-storage");

// 初始化 LeanCloud 应用
AV.init({
  appId: "appId", // 替换为你的 App ID
  appKey: "appKey", // 替换为你的 App Key
  serverURL: "https://cn-n1-console-api.leancloud.cn", // 替换为你的 Server URL
});


// 辅助函数下载文件
const downloadFile = (url, outputPath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(outputPath); // 删除文件
      reject(err.message);
    });
  });
};

function getFiles() {
  // 获取文件
  return new Promise((resolve, reject) => {
    const query = new AV.Query('_File');
    query.find().then((nodes) => {
      const files = nodes.map(node => {
        return {
          url: node.get('url'),
          name: node.get('name')
        }
      });
      resolve(files);
    }).catch((error) => {
      reject(error);
      console.error('获取文件失败', error);
    });
  })
}

async function init() {
  const fileUrls = await getFiles();
  // 下载所有文件
  await Promise.all(
    fileUrls.map(({ url, name }) => {
      // 提取文件名，并定义本地下载路径
      const fileName = url.split('/').pop();
      const outputPath = `./downloaded/${name || fileName}`;
      const realUrl = url.replace('http://', 'https://');
      return downloadFile(realUrl, outputPath);
    })
  )
    .then(() => {
      // 所有文件下载完成后进行提交
      execSync('git config --local user.name "Zgrowth"');
      execSync('git config --local user.email "18296884762@163.com"');
      execSync('git add downloaded/*');
      execSync(`git commit -m "Add downloaded files ${new Date().getTime()}"`);
      execSync('git push');
      // 文件上传到仓库后将中转站的文件全部删除
      deleteClassData();
    })
    .catch((error) => {
      console.error('Error downloading files:', error);
    });
}

function deleteClassData() {
  const query = new AV.Query('_File');
  query.find().then((results) => {
    // 创建一个删除操作的数组
    const deletes = results.map(item => {
      return AV.Object.createWithoutData('_File', item.id).destroy();
    });

    // 并发执行所有删除操作
    return Promise.all(deletes);
  }).then(() => {
    console.log('全部数据已被删除。');
  }).catch((err) => {
    console.error('删除过程中出现错误:', err);
  });
}

init();
```

由于上面js文件使用到了leancloud-storage包，所以需要package.json
```js
// package.json
{
  "name": "z-file",
  "version": "1.0.0",
  "description": "",
  "main": "download-and-commit.js",
  "scripts": {
    "start": "node ./download-and-commit.js"
  },
  "keywords": [],
  "author": "zs",
  "license": "ISC",
  "dependencies": {
    "leancloud-storage": "^4.15.2"
  }
}
```

3. 使用github action 定时触发，并执行上述js文件

```js
name: Download and Commit Files

on:
  workflow_dispatch:  # 手动触发
   # 定时器 github服务器时间比北京时间晚8小时 定时早上6点执行
  schedule: 
    - cron: '0 16 * * *'

jobs:
  download-and-commit:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2
        with:
          token: ${{ secrets.REPO_ACCESS_TOKEN }}

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '14'

      - name: npm install
        run: npm install
    
      - name: Download files and commit
        run: npm start
```

---
#### 解决没有足够的权限来推送文件到你的仓库

```js
当 GitHub Actions 报告 "Permission to user/repo.git denied to github-actions[bot]" 错误时，这意味着尝试使用的 GitHub Token 没有足够的权限来推送到你的仓库。其中一个常见原因是尝试推送到一个受保护的分支，GitHub 默认的 GITHUB_TOKEN 没有权限执行这样的操作。

解决这个问题的方法之一是在仓库的 "Settings" -> "Secrets" 中添加一个有足够权限的 Personal Access Token (PAT)，然后在你的 GitHub Actions 工作流中使用这个 PAT。

步骤如下：

1. 生成 Personal Access Token:

前往 GitHub -> Settings -> Developer settings -> Personal access tokens -> Generate new token。确保给予 token repo 范围的权限，以便它可以访问你的仓库。

2. 添加 PAT 到 GitHub 仓库的 Secrets:

前往仓库的 Settings -> Secrets -> New repository secret。添加一个名称（例如 REPO_ACCESS_TOKEN），粘贴你的 Personal Access Token。

3. 修改你的 GitHub Actions 工作流文件:

更新你的工作流文件（.github/workflows/your-workflow.yml），在相应步骤中使用这个新的 secret 来做身份验证。例如：

jobs:
  push-commit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2
        with:
          token: ${{ secrets.REPO_ACCESS_TOKEN }}  # 使用你的 Personal Access Token 代替默认的 GITHUB_TOKEN
          # 其他配置...

      # ... 其它步骤 ...

```

