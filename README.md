# nodejs-user-hekr
使用nodejs作为用户端接入氦氪云平台

### 必备条件：
* 氦氪云平台的开发者账号(个人开发者认证就可以了)
* nodejs https://nodejs.org/en/download 我使用的nodejs版本为v7.2.0

### 使用方法：
代码开头的位置
```javascript
return "APP_NODEJS_" + "SN20170801001";   使用前请修改，appTid代表APP ID，可以自己定义APP ID规则 
pid:"xxxxxx",   使用丛云APP的用户，这里填11个0，如果是定制APP的用户，请填定制APP使用的pid
username:"xxxxxx",   用户名
password:"xxxxxx",   密码
```

代码结尾的位置
```javascript
appFunction,parseDevSend这2个函数的内容需要开发者自己完成
appFunction()   具体的APP功能在此函数中完成
parseDevSend(jsonData)   根据产品通信协议，解析设备上报的协议数据
```
我为appFunction函数编写了默认的功能，脚本运行之后，在CMD窗口可以输入以下形式的数据：
1. **eval:1+1**

     eval:后面可以跟任何的javascript语句，我们可以查看当前脚本中的变量和执行其中的函数。 
     
     示例：     
     1. eval:cls()          
        清屏。
     2. sendDataToDevice("xxxxxx","yyyyyy",'"raw":"48070201010154"',app.mainTCPLink)    
        向devTid为"xxxxxx"，ctrlKey为"yyyyyy"的设备发送协议数据"raw":"48070201010154"
     3. sendDataToDevice("xxxxxx","yyyyyy",'"cmdId":2,"power":1',app.mainTCPLink)  
        向devTid为"xxxxxx"，ctrlKey为"yyyyyy"的设备发送协议数据"cmdId":2,"power":1
  
2. **{"msgId" : 1,"action" : "heartbeat"}**

     这样直接输入的JSON字符串必须符合[氦氪设备云端通信协议](http://docs.hekr.me/v4/%E5%BC%80%E5%8F%91%E6%96%87%E6%A1%A3/%E9%80%9A%E4%BF%A1%E5%8D%8F%E8%AE%AE/%E8%AE%BE%E5%A4%87%E4%BA%91%E7%AB%AF%E9%80%9A%E4%BF%A1%E5%8D%8F%E8%AE%AE/)规范。

user-example.js中出现的两个设备分别来自以下两篇教程：

[氦氪云入门教程03-使用氦氪透传协议的温湿度计](http://bbs.hekr.me/forum.php?mod=viewthread&tid=62&fromuid=1)

[氦氪云入门教程04-基于氦氪主控协议的作品-SDK演示插座](http://bbs.hekr.me/forum.php?mod=viewthread&tid=74&fromuid=1)

详细的使用实例请参考
[使用nodejs作为用户端接入氦氪云平台](http://bbs.hekr.me/forum.php?mod=viewthread&tid=93&fromuid=1)

### 注意事项：
* 本程序支持TCP断线重连，路由器断电或者断网恢复之后，TCP会重新连接。

### 参考文档：

[氦氪云联网功能组件](http://docs.hekr.me/v4/%E5%BC%80%E5%8F%91%E6%96%87%E6%A1%A3/%E4%BA%91%E7%AB%AFAPI/%E8%AE%BE%E5%A4%87%E8%81%94%E7%BD%91/)
