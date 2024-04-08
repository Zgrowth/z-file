const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');
const AV = require("leancloud-storage");

// 初始化 LeanCloud 应用
AV.init({
  appId: "f2b0Nh5pSJzstBiy3p0iajM2-gzGzoHsz", // 替换为你的 App ID
  appKey: "MY0v9ZfgAOf5VZGgBP4eiG6e", // 替换为你的 App Key
  serverURL: "https://cn-n1-console-api.leancloud.cn", // 替换为你的 Server URL
});


// 辅助函数下载文件
const downloadFile = (url, outputPath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    http.get(url, (response) => {
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
  console.log('fileUrls🍑:', fileUrls);
  // 下载所有文件
  await Promise.all(
    fileUrls.map(({ url, name }) => {
      // 提取文件名，并定义本地下载路径
      const fileName = url.split('/').pop();
      const outputPath = `./downloaded/${name || fileName}`;
      // const realUrl = url.replace('http://', 'https://');
      return downloadFile(url, outputPath);
    })
  )
    .then(() => {
      // 所有文件下载完成后进行提交
      execSync('git config --local user.name "Zgrowth"');
      execSync('git config --local user.email "18296884762@163.com"');
      execSync('git add downloaded/*');
      execSync(`git commit -m "Add downloaded files ${new Date().getTime()}"`);
      execSync('git push');
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
