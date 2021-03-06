// 文档预览方式
var previewCategory = {".doc":"flash",".docx":"flash",".ppt":"flash",".pptx":"flash",".pdf":"flash",".rtf":"flash",".wps":"flash",".et":"flash",".dps":"flash",".odt":"flash",".odp":"flash",".ott":"flash",".ots":"flash",".otp":"flash",".vsd":"flash",".vss":"flash",".vst":"flash",".xls":"html",".xlsx":"html",".mht":"html",".html":"html",".htm":"html",".txt":"html",".rst":"html",".xml":"html",".css":"html",".csv":"html",".java":"html",".c":"html",".cpp":"html",".jsp":"html",".asp":"html",".php":"html",".py":"html",".as":"html",".sh":"html",".rar":"RAR",".zip":"RAR",".tar":"RAR",".tgz":"RAR",".gz":"RAR",".mp3":"audio",".wma":"audio",".rm":"audio",".wav":"audio",".mid":"audio",".avi":"video",".rmvb":"video",".rmvb":"video",".mov":"video",".mp4":"video",".swf":"video",".flv":"video",".mpg":"video",".ram":"video",".wmv":"video",".m4v":"video",".3gp":"video",".png":"image",".gif":"image",".jpg":"image",".jpeg":"image",".bmp":"image",".tiff":"image",".ppm":"image",".dwg":"image"};

// 重试次数
var retryCount = 200;
// 间隔时间(秒)
var intervalSecond = 3;

// 文档转换提示
function tipsFunc(serverURL, type, info) {
  if (info == undefined) {
    if (type == 'loading') {
      return '加载中请稍候 <img src="' + serverURL + '/edoviewer/waiting.gif">';
    } else if (type == 'converting') {
      return '转换中请稍候 <img src="' + serverURL + '/edoviewer/waiting.gif">';
    } else {
      return '转换超时，请刷新后重试...';
    }
  } else {
    var re = /^function\s?(.*)/;
    if (info instanceof Function) {
      return info();
    }
    else if (re.test(info)) {
      var func = info.match(re)[1];
      if (func) {
        return eval('info=' + info + ';info();');
      } else {
        return info;
      }
    } else {
      return info;
    }
  }
}

function statusFunc(status) {
  var statusText = {
    400: '签名不正确',
    401: '超时',
    403: '路径无权限',
    404: '无此文件',
    405: '正在转换',
    406: '转换失败',
    407: '正在下载',
    408: 'ip不匹配',
    409: '账户不存在'
  }
  return statusText[status] || 'Error: status code is ' + status;
}

String.prototype.encodeJs = function() {
  var o = [/\\/g, /"/g, /'/g, /\//g, /\r/g, /\n/g, /;/g, /#/g, /\+/g, /&/g];
  var n = ['\\u005C', '\\u0022', '\\u0027', '\\u002F', '\\u000A', '\\u000D', '\\u003B', '\\u0032', '\\u002B', '\\u0026'];
  var s = this;
  for (var i = 0; i < o.length; i++) {
    s = s.replace(o[i], n[i]);
  }
  return s;
};
Object.serializeStr = function(obj) {
  if(obj == null) return null;
  if(obj.serializeStr) return obj.serializeStr();
  var cst = obj.constructor;
  switch(cst) {
    case String: return '"' + obj.encodeJs() + '"';
    case Date: return 'new Date(' + obj.getTime() + ')';
    case Array:
      var ar = [];
      for (var i = 0; i < obj.length; i++) ar[i] = Object.serializeStr(obj[i]);
      return '[' + ar.join(',') + ']';
    case Object:
      var ar = [];
      for (var i in obj) {
        ar.push('"' + (i+'').encodeJs() + '":' + Object.serializeStr(obj[i]));
      }
      return '{' + ar.join(',') + '}';
    case Function: return '"' + obj.toString().encodeJs() + '"';
    default:
      return obj;
  }
};

function embedFrame(identify, kwargs, url) {
  kwargs['embedded'] = true;
  var src = kwargs.server_url + '/edo_viewer?kwargs=' + Object.serializeStr(kwargs);
  var width = getParentValue(kwargs.width);
  var height = getParentValue(kwargs.height);

  if (mobileAccess) {
    var html = '<div style="overflow:scroll;-webkit-overflow-scrolling:touch;width:' + width[1] + ';height:' + height[1] + '">';
  } else {
    var html = '';
  }
  html += '<iframe frameBorder="0" width="' + width[0] + '" height="' + height[0] + '" src=' + src + '></iframe>';
  if (mobileAccess) {
    html += '</div>';
  }
  document.getElementById(identify).innerHTML = html;
}

var mobileAccess = /android|iphone|ipod|series60|symbian|windows ce|blackberry/i.test(navigator.userAgent);

/****************************************** Ajax *************************************************/

function xmlHttpRequest(n, url, type, identify, kwargs, method, onlyRequest) {
  if (n > retryCount - 1) {
    if (!onlyRequest) {
      document.getElementById(identify).innerHTML = tipsFunc(kwargs.server_url, 'timeout', kwargs.timeout_info);
    }
    return;
  }
  var xhr = null;
  if (window.XMLHttpRequest) {
    // If IE7, Mozilla, Safari, and so on: Use native object.
    xhr = new XMLHttpRequest();
  } else {
    if (window.ActiveXObject) {
      // ...otherwise, use the ActiveX control for IE5.x and IE6.
      xhr = new ActiveXObject('MSXML2.XMLHTTP.3.0');
    }
  }
  if (!xhr) {
    document.getElementById(identify).innerHTML = "Error initializing XMLHttpRequest!";
    return;
  }
  xhr.open(method, url, true);
  xhr.send(null);
  xhr.onreadystatechange = function(){callbackFunc(xhr, n, url, type, identify, kwargs, method, onlyRequest)};
}

function ajaxRequest(n, url, type, identify, kwargs, method, onlyRequest) {
  if (n == 0 && !onlyRequest) {
    document.getElementById(identify).innerHTML = tipsFunc(kwargs.server_url, 'loading', kwargs.loading_info);
  }
  var origin = window.location.protocol + '//' + window.location.host;
  // browser IE8 realse support XDomainRequest
  if (navigator.appName == 'Microsoft Internet Explorer' && origin.indexOf(kwargs.server_url) == -1 && type != 'html') {
    var version = navigator.appVersion.split(";")[1].replace(/ +MSIE +/, '');
    if ((version > 8.0 || version == 8.0)) {
      if (n > retryCount - 1) {
        if (!onlyRequest) {
          document.getElementById(identify).innerHTML = tipsFunc(kwargs.server_url, 'timeout', kwargs.timeout_info);;
        }
        return;
      }
      var xdr = new XDomainRequest();
      xdr.open('GET', url);
      xdr.onload = function() {
        if (method == 'GET') {
          responseSuccess(xdr, url, type, identify, kwargs);
        }
        else if (!hasShow) {
          responseSuccess(xdr, url, type, identify, kwargs);
        }
      }
      xdr.onerror = function() {
        window.setTimeout(function(){ajaxRequest(n + 1, url, type, identify, kwargs, method, onlyRequest);}, intervalSecond * 1000);
        if (!onlyRequest) {
          document.getElementById(identify).innerHTML = tipsFunc(kwargs.server_url, 'converting', kwargs.converting_info);
        }
      }
      var hasShow = false;
      function progres() {
        if (hasShow) { return false; }
        if (method == 'HEAD') {
          responseSuccess(xdr, url, type, identify, kwargs);
          hasShow = true;
        }
      }
      xdr.onprogress = progres;
      try {
        xdr.send(null);
      } catch(ex) {}
    } else {
      // IE5.x and IE6 and IE7 browser iframe embedded
      embedFrame(identify, kwargs, url);
    }
  } else {
    if (type == 'html' && !kwargs.embedded) {
      embedFrame(identify, kwargs, url);
    }
    else {
      xmlHttpRequest(n, url, type, identify, kwargs, method, onlyRequest);
    }
  }
}

function callbackFunc(xmlHttp, n, url, type, identify, kwargs, method, onlyRequest) {
  if (xmlHttp.readyState == 4) {
    if (xmlHttp.status == 200) {
      responseSuccess(xmlHttp, url, type, identify, kwargs);
    }
    else if (xmlHttp.status == 404 || xmlHttp.status == 0) {
      window.setTimeout(function(){ajaxRequest(n + 1, url, type, identify, kwargs, method, onlyRequest);}, intervalSecond * 1000);
      if (!onlyRequest) {
        document.getElementById(identify).innerHTML = tipsFunc(kwargs.server_url, 'converting', kwargs.converting_info);
      }
    }
    else {
      if (!onlyRequest) {
        document.getElementById(identify).innerHTML = statusFunc(xmlHttp.status);
      }
    }
  }
}

function responseSuccess(xmlHttp, url, type, identify, kwargs) {
  kwargs['callback'] = true;
  if (type == 'html') {
    render_html_viewer(url, identify, kwargs);
  }
  else if (type == 'RAR') {
    kwargs['data'] = eval('(' + xmlHttp.responseText + ')');
    render_zip_viewer(url, identify, kwargs);
  }
  else if (type == 'audio') {
    render_audio_viewer(url, identify, kwargs);
  }
  else if (type == 'video') {
   render_video_viewer(url, identify, kwargs);
  }
  else if (type == 'image') {
    render_image_viewer(url, identify, kwargs);
  }
  else if (type == 'image-exif') {
    kwargs['data'] = eval('(' + xmlHttp.responseText + ')');
    render_exif_viewer(url, identify, kwargs);
  }
}

/****************************************** END **************************************************/


/**************************************** 公共方法 ***********************************************/

// 进行编码处理
function encodeURL(url) {
  return encodeURI(url).replace(/#/g, '%23').replace(/\?/g, '%3F');
}

// 删除最后斜杠
function removeLastSlash(url) {
  if (url.charAt(url.length-1) == '/') {
    var url = url.substring(0, url.length-1);
  }
  return url;
}

// 得到文件后缀
function getExt(url) {
  var splitURL = url.split('/');
  var endChar = url.split('/').reverse();
  if (!endChar[0]) {
    endChar = endChar[1];
  } else {
    endChar = endChar[0];
  }

  if (endChar.indexOf('?') == -1) {
    var ext = ('.' + endChar.split('.')[endChar.split('.').length-1]).toLowerCase();
  } else {
    var splitExt = (endChar.split('.')[endChar.split('.').length-1]).split('?');
    var ext = ('.' + splitExt[0]).toLowerCase();
  }
  return ext;
}

// 得到预览类型
function getType(ext) {
  var type = previewCategory[ext];
  if (type == 'flash') {
    if (swfobject.getFlashPlayerVersion()['major'] < 9 || mobileAccess) {
      type = 'html';
    }
  }
  return type;
}

// 得到预览地址
function getURL(type, kwargs) {
  var patterns = {
    'flash': 'application_x-shockwave-flash-x',
    'html': 'text_html',
    'RAR': 'application_json',
    'audio': 'audio_x-mpeg',
    'video': 'video_x-flv',
    'image': 'image_png',
    'image-exif': 'application_exif-x-json'
  }
  var pattern = patterns[type];
  if (pattern == undefined) {
    return;
  } else {
    var location = kwargs.location || ''
      ,ip = kwargs.ip || ''
      ,timestamp = kwargs.timestamp || ''
      ,app_id = kwargs.app_id || ''
      ,account = kwargs.account || ''
      ,username = kwargs.username || ''
      ,download_source = kwargs.download_source || ''
      ,signcode = kwargs.signcode || '';

    var paramsObject = {
      source_url: kwargs.source_url,
      ip: ip,
      timestamp: timestamp,
      app_id: app_id,
      account: account,
      username: username,
      download_source: download_source,
      signcode: signcode
    }

    var url = kwargs.server_url + '/download?';
    if (location) {
      url += 'location=' + location;
    } else {
      var dirMD5 = hex_md5(kwargs.source_url) + kwargs.ext;
      url += 'location=' + '/files/' + dirMD5;
    }

    for (var key in paramsObject) {
      if (!paramsObject[key]) {
        continue;
      }
      url += '&' + key + '=' + encodeURL(paramsObject[key]);
    }

    if (!/(mp3|flv|swf)$/i.test(kwargs.ext)) {
      url += '&mime=' + pattern;
    }

    if (type == 'image') {
      url += '&subfile=image_large';
    }
    return url;
  }
}

// 得到父高宽值
function getParentValue(value) {
  var pxValue = '800px';
  if (value == undefined) {
    value = pxValue;
  }
  else if (/px$/i.test(value)) {
    pxValue = value = value.replace(/px/i, '') + 50 + 'px';
  }
  else if (/em$/i.test(value)) {
    var reValue = value.replace(/em/i, '');
    pxValue = (reValue + 1) * 10 + 'px';
    value = reValue + 5 + 'em';
  }
  else if (/\d$/.test(value)) {
    pxValue = value + 50 + 'px';
    value = value + 50;
  }
  else if (/%$/.test(value)) {
    value = '100%';
  }
  return [value, pxValue];
}

/****************************************** END **************************************************/


/****************************************** API **************************************************/

var EdoViewer = {

  createViewer: function (identify, kwargs) {
    var serverURL = removeLastSlash(kwargs.server_url)
       ,sourceURL = removeLastSlash(kwargs.source_url)
        ,location = kwargs.location;

    if (!(serverURL || sourceURL)) {
      return false;
    }

    var ext = getExt(location || sourceURL)
      ,type = getType(ext);

    kwargs.server_url = serverURL;
    kwargs.source_url = sourceURL;

    if (type) {
      kwargs['ext'] = ext;
      var url = getURL(type, kwargs);
    }

    function renderViewer () {
      if (type == 'flash') {
        render_flash_viewer(url, identify, kwargs);
      }
      else if (type == 'html') {
        render_html_viewer(url, identify, kwargs);
      }
      else if (type == 'RAR') {
        render_zip_viewer(url, identify, kwargs);
      }
      else if (type == 'audio') {
        render_audio_viewer(url, identify, kwargs);
      }
      else if (type == 'video') {
        render_video_viewer(url, identify, kwargs);
      }
      else if (type == 'image') {
        render_image_viewer(url, identify, kwargs);
      } else {
        document.getElementById(identify).innerHTML = '该文件的预览方式暂没添加上去！';
      }
    }

    var viewer = {
      load: function () {
        return renderViewer();
      }
    }
    return viewer;
  }

  ,load: function () {
    return viewer.load();
  }
}

/****************************************** END **************************************************/
