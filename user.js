/*
Author: LawrenceDon 
Mail: lawrencedon@163.com
QQ: 20515042 
Website: www.espruino.cn
Github: github.com/LawrenceDon/nodejs-device-hekr
MIT License 
Copyright (c) 2017 LawrenceDon
*/

var debugOutputFlag = true; //设置是否输出debug信息，本脚本运行之后，在CMD窗口输入eval:logOn()或者eval:logOff()来打开或者关闭debug信息输出
function getAppTid() 
{
  return "APP_NODEJS_" + "SN20170801001"; //使用前请修改，appTid代表APP ID，可以自己定义APP ID规则  
}

var user = {
	pid:"xxxxxx", //使用丛云APP的用户，这里填11个0，如果是定制APP的用户，请填定制APP使用的pid
	username:"xxxxxx", //用户名
	password:"xxxxxx", //密码
	clientType:"WEB"
};

var app = { 
	appTid:"",
	token:"",
  mainTCPLink:null,
  mainTCPLinkReady:false,
  heartbeatIntervalID:0
};

var server = {
	host:"asia-app.hekr.me",
	port:85
};    

var net = require('net');
var msgId = -1;     
var respStrTemp = "";  
var heartbeatRespFlag = 0;

function getMsgId() 
{
  if(msgId == 65535) 
  {
    msgId = 0;
  } 
  else 
  {
    msgId++;
  }                
  return msgId;
}

function isRespComplete(data)
{
  var index0 = data.indexOf("\n");  
  if(index0 != -1)
  {
    return 1;  
  }
  return 0;   
}         
                                                                                           
function login()
{
  var login_tpl='{"msgId" : "{msgId}","action" : "appLogin","params" : {"appTid" : "{appTid}","token" : "{token}"}}\n'; 
  var login_str=login_tpl.replace('{msgId}',getMsgId()).replace('{appTid}',app.appTid).replace('{token}',app.token);  
  app.mainTCPLink = net.connect(server, function(){ 
    debugOutput("main TCP connected!");  
    debugOutput('CONNECTED TO : ' + server.host + ':' + server.port);	
    debugOutput('main send appLogin : ' + login_str);
    app.mainTCPLink.write(login_str);	 
  });
  loginBind(app.mainTCPLink);
}

function loginBind(client)
{
  client.on('data', function(data){
    respStrTemp += data;
    if(isRespComplete(respStrTemp) == 1)
    {
      var jsonData = JSON.parse(respStrTemp);
      if(jsonData != undefined)
      { 
        parseData(jsonData);
      }
      respStrTemp = ""; 
     }     
  });

  client.on('error', function(e){
    debugOutput("main connection error!");
	  debugOutput(e);  
  });

  client.on('close', function(){
    debugOutput('main connection closed');
    if(app.heartbeatIntervalID != 0)
    {
      clearInterval(app.heartbeatIntervalID);
      app.heartbeatIntervalID = 0;
    }
    app.mainTCPLinkReady = false;
    heartbeatRespFlag = 0;    
    debugOutput("reconnect for login");
    setTimeout(login,5000);     
  });  
}

function parseData(jsonData)  
{
  switch(jsonData.action){
    case "heartbeatResp":
      if(jsonData.code == 200)
      {
        heartbeatRespFlag = 0;
        debugOutput("main receive : " + jsonData.action + " with msgId " + jsonData.msgId);        
      }
      else
      {
        debugOutput("main receive : " + jsonData.action + " with error {code:" + jsonData.code + ", desc:" + jsonData.desc + "}");   
      }
      break;
    case "appLoginResp":
      debugOutput("main receive : " + JSON.stringify(jsonData));
      if(jsonData.code == 200)
      {
        debugOutput("main receive : " + jsonData.action);
        app.mainTCPLinkReady = true;        
        app.heartbeatIntervalID = setInterval(function(){ 
          if(heartbeatRespFlag == 0)
          {
            heartbeatRespFlag = 1;           
            var msgId = getMsgId(); 
            debugOutput("main send : heartbeat with msgId " + msgId);  
            app.mainTCPLink.write('{"msgId" : ' + msgId + ',"action" : "heartbeat"}\n');
          }
          else
          {
            app.mainTCPLinkReady = false;
            debugOutput("no heartbeat response");      
          }
        }, 25000);   
        console.log("!!!Ready!!!");		
      }
      else
      {
        debugOutput("main receive : " + jsonData.action + " with error {code:" + jsonData.code + ", desc:" + jsonData.desc + "}");   
      }
      break;
    case "devSend":
      parseDevSend(jsonData);
      break;
    case "errorResp":
      debugOutput("main receive : " + jsonData.action + " with error {code:" + jsonData.code + ", desc:" + jsonData.desc + "}");  
      break;
    default:
      debugOutput("main receive : " + JSON.stringify(jsonData));                
  }   
}

function sendData(data,tcplink)
{
  if(app.mainTCPLinkReady == true)
  {
    debugOutput("sendData : " + data);
    tcplink.write(data);   
  } 
  else
  {
    debugOutput("TCP link is not ready!");  
  }
} 

function sendDataToDevice(devTid,ctrlKey,data,tcplink)
{
  var send_tpl='{"msgId" : "{msgId}","action" : "appSend","params" : {"devTid" : "{devTid}","ctrlKey" : "{ctrlKey}","appTid" : "{appTid}","data" : {{data}}}}\n';
  var send_str=send_tpl.replace('{msgId}',getMsgId()).replace('{devTid}',devTid).replace('{ctrlKey}',ctrlKey).replace('{appTid}',app.appTid).replace('{data}',data); 
  if(app.mainTCPLinkReady == true)
  {
    debugOutput("sendDataToDevice : " + send_str);
    tcplink.write(send_str);   
  } 
  else
  {
    debugOutput("TCP link is not ready!");  
  }
} 

function uartdataDecode(frame){
	var data="";
	if(frame.length<=10)
	{
		return "";
	}
	data=frame.substring(8, frame.length-2)				
    data=data.replace(/(\w{2})/g,'$1 ').replace(/\s*$/,'').split(' ');
	for(var i in data)
	{
		data[i]=parseInt(data[i],16);
	}
	return data;
}

function getToken(callback,user)
{
  var pid = user.pid;   
  var username = user.username;
  var password = user.password;
  var clientType = user.clientType;
  var http = require("http");
  var options = {
    "method": "POST",
    "hostname": "uaa-openapi.hekr.me",
    "path": "/login",
    "headers": {
      "accept": "application/json",
      "content-type": "application/json",
    }
  };
  var req = http.request(options, function(res){
    var chunks = [];
    res.on("data", function(chunk){
      chunks.push(chunk);
    });
    res.on("end", function(){
      var body = Buffer.concat(chunks);
      var jsonBody = JSON.parse(body.toString());
      app.token = jsonBody.access_token;
      callback();      
    });
  });
  req.write(JSON.stringify({"pid": pid,
    "username": username ,
    "password": password,
    "clientType": clientType}));  
  req.end(); 
}

function getCurrentDateTime()
{
  var date=new Date();
  return date.toLocaleString();
}

function debugOutput(content)
{
  if(debugOutputFlag == true)
  console.log(getCurrentDateTime() + " : " + content);
}

function logOn()
{
  debugOutputFlag = true;
}

function logOff()
{
  debugOutputFlag = false;
}

function startAPP()
{
  app.appTid = getAppTid();   
  getToken(login,user);   
  appFunction();
}

function cls() //清屏
{
  console.log('\033[2J\033[0;0H');	
}

//appFunction,parseDevSend这2个函数的内容需要开发者自己完成
function appFunction() //具体的APP功能在此函数中完成
{
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', function(){
    var data = process.stdin.read();
    if(data !== null){
		  data=data.substring(0,data.length-2); //去除\r\n 
      if(data[0]=='e' && data[1]=='v' && data[2]=='a' && data[3]=='l' && data[4]==':')
      {
        console.log(eval(data.substr(5))); //示例：直接在cmd窗口输入或ctrl+v eval:1+1
      }
      else
      {
        if(data.length >0 && app.mainTCPLinkReady == true)
        {
          data=data + '\n';
          sendData(data,app.mainTCPLink); //示例：直接在cmd窗口输入或ctrl+v {"msgId" : 1,"action" : "heartbeat"}
        }
      }
	}
  });
}

function parseDevSend(jsonData) //根据产品通信协议，解析设备上报的协议数据
{ 
  debugOutput("main receive devSend:  " + JSON.stringify(jsonData));
  debugOutput("main receive devSend:  devTid  " + jsonData.params.devTid);
  debugOutput("main receive devSend:  data  " + JSON.stringify(jsonData.params.data)); 
}

startAPP();
