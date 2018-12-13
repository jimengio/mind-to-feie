# mind to feie

这是一个将脑图文件中的内容作为测试用例导入到“[飞蛾](https://feie.work/)”的工具。

## 使用

```
Usage: node main.js [options]

Options:
  -V, --version          output the version number
  --domain-key <string>  团队登录地址前缀。
  --api-key <string>     API key
  --api-secret <string>  API secret
  --project-id <number>  项目 id
  --file <string>        要导入的文件路径
  --format <string>      要导入的文件格式，默认为xmind格式。xmind | mmap
  --force-update         当服务器上存在同名用例时强制更新
  -h, --help             output usage information
```