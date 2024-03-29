// download-and-commit.js
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

// 假设我们已经获取到了要下载的文件列表 URL
const fileUrls = [
    'https://example.com/file1.txt',
    'https://example.com/file2.txt',
    // 添加更多 URL...
];

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

// 下载所有文件
Promise.all(
    fileUrls.map(url => {
        // 提取文件名，并定义本地下载路径
        const fileName = url.split('/').pop();
        const outputPath = `./downloaded/${fileName}`;
        return downloadFile(url, outputPath);
    })
)
.then(() => {
    // 所有文件下载完成后进行提交
    execSync('git config --local user.name "GitHub Actions"');
    execSync('git config --local user.email "actions@github.com"');
    execSync('git add downloaded/*');
    execSync('git commit -m "Add downloaded files"');
    execSync('git push');
})
.catch((error) => {
    console.error('Error downloading files:', error);
});
