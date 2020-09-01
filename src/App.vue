<!--
 * @Description: Description
 * @Author: Yongchao Wang
 * @Date: 2020-08-24 06:46:19
 * @LastEditors: Yongchao Wang
 * @LastEditTime: 2020-09-01 20:07:32
-->
<template>
  <div class="container">
    <div :class="listClass">
      <div class="cell" v-for="(item, index) in uploadlist" :key="index">
        <img :src="item.path" class="mini-img" />
        <div class="upload-status">{{item.status}}</div>
        <div class="upload-percent">{{item.percent}}</div>
      </div>
    </div>
    <div :class="bgcontainer" id="drag">
      <div class="bg-container">
        <img :src="dropImg" class="bg" alt />
        <div :class="tipClass">Drop .JPG/.PNG Images here!</div>
      </div>

      <div class="tool">
        <div>{{uploadlist.length}} tasks</div>
        <div style="display: flex;">
          <div id="folder" @click="openDirectory"></div>
          <div id="setting" @click="settingClick"></div>
        </div>
      </div>
      <div class="setting-input">
        <div class="input-container">
          <label class="input-title">API Key:</label>
          <input id="key" class="key-input" type="text" placeholder="API Key" v-model="APIKey" />
        </div>
        <div class="input-container">
          <label class="input-title">OutputPath:</label>
          <input
            id="output"
            class="key-input"
            type="text"
            placeholder="输出路径"
            webkitdirectory
            directory
            :value="outputPath"
            @change="outputChange($event)"
          />
          <button @click="selectfile">...</button>
        </div>
        <div class="input-container">
          <label class="input-title">ReplaceOrigin:</label>
          <input id="replace" type="checkbox" v-model="origin" value="Origin" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { log } from "console";
const BrowserWindow = require("electron").remote.BrowserWindow;
const { dialog } = require("electron").remote;
const shell = require("electron").shell;
const os = require("os");
const fs = require("fs");
const Store = require("electron-store");
const store = new Store();

export default {
  data() {
    return {
      uploadlist: [],
      uploadIndex: 0,
      isbusy: false,
      ot: "",
      oloaded: "",
      listClass: ["list", "lhidden"],
      tipClass: ["tip"],
      dropImg: "./assets/zip.png",
      origin: store.get("origin"),
      APIKey: store.get("APIKey"),
      url: "https://api.tinify.com/shrink",
      bgcontainer:
        store.get("window-height") === 500 ? "bgcontainer-show" : "bgcontainer",
      outputPath: this.getOutputPath(),
    };
  },

  components: {},

  computed: {},

  watch: {
    APIKey(newval, oldval) {
      store.set("APIKey", newval);
    },
    origin(newval, oldval) {
      store.set("origin", newval);
    },
  },

  mounted() {
    if (store.get("window-height") === 500) {
      BrowserWindow.getFocusedWindow().setContentSize(400, 500, false);
      this.bgcontainer = "bgcontainer-show";
      store.set("window-height", 500);
    } else {
      BrowserWindow.getFocusedWindow().setContentSize(400, 400, false);
      this.bgcontainer = "bgcontainer";
      store.set("window-height", 400);
    }
    console.log(store.get("window-height"));
    fs.exists(this.outputPath, function (exists) {
      if (!exists) {
        fs.mkdir(this.outputPath, function () {});
      }
    });
    const dragWrapper = document.getElementById("drag");
    dragWrapper.addEventListener("drop", (e) => {
      e.preventDefault(); //阻止e的默认行为
      if (!store.get("APIKey")) {
        dialog
          .showMessageBox({
            type: "warning",
            title: "APIKey Is Required",
            message: "Please Enter APIKey",
            buttons: ["OK", "Get It Now"],
          })
          .then((result) => {
            if (result.response === 1) {
              shell.openExternal("https://tinypng.com/developers");
            }
          });
        return;
      }
      const files = e.dataTransfer.files;
      if (files && files.length >= 1) {
        this.addPng(files);
      }
    });
    //这个事件也需要屏蔽
    dragWrapper.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
  },

  methods: {
    getOutputPath() {
      if (store.get("outputPath")) {
        return store.get("outputPath");
      }
      var p = navigator.platform;

      if (p.indexOf("Win") == 0) {
        store.set("outputPath", os.homedir() + "/Downloads/TinyAll-output");
        return os.homedir() + "\\Downloads\\TinyAll-output";
      } else if (p.indexOf("Mac") == 0) {
        store.set("outputPath", os.homedir() + "/Downloads/TinyAll-output");
        return os.homedir() + "/Downloads/TinyAll-output";
      }
      return "";
    },
    //setting click
    settingClick(e) {
      if (BrowserWindow.getFocusedWindow().getContentSize()[1] > 400) {
        BrowserWindow.getFocusedWindow().setContentSize(400, 400, false);
        this.bgcontainer = "bgcontainer";
        store.set("window-height", 400);
      } else {
        BrowserWindow.getFocusedWindow().setContentSize(400, 500, false);
        this.bgcontainer = "bgcontainer-show";
        store.set("window-height", 500);
      }
    },
    // outputpath
    outputChange(event) {
      console.log(document);
    },
    // selectpath button click
    selectfile() {
      dialog
        .showOpenDialog({
          filters: [
            { name: "jpg", extensions: ["jpg"] },
            { name: "png", extensions: ["png"] },
            { name: "jpg", extensions: ["jpeg"] },
          ],
          properties: ["openDirectory"],
          title: "select picture",
        })
        .then((res) => {
          if (res.canceled === false && res.filePaths.length) {
            store.set("outputPath", res.filePaths[0]);
            this.outputPath = res.filePaths[0];
          }
        });
    },
    openDirectory() {
      fs.exists(store.get("outputPath"), function (exists) {
        if (!exists) {
          fs.mkdir(store.get("outputPath"), function () {
            shell.showItemInFolder(store.get("outputPath"));
          });
        } else {
          shell.showItemInFolder(store.get("outputPath"));
        }
      });
    },
    addPng(files) {
      for (let element of files) {
        if (element.type.indexOf("image/") === -1) {
          return;
        }
        this.uploadQueue(element);
      }

      this.listClass = ["list", "lshow"];
      this.tipClass = ["tip", "lhidden"];
      this.dropImg = "";
    },

    uploadQueue(file) {
      file.status = "等待上传";
      file.percent = "--";
      this.uploadlist.push(file);
      if (!this.isbusy) {
        this.uploadFile(file);
      }
    },
    uploadFile(fileObj) {
      this.isbusy = true;
      var url = this.url; // 接收上传文件的后台地址
      let apiKey = store.get("APIKey");
      const key = btoa(`api:${apiKey}`);
      var form = new FormData(); // FormData 对象
      form.append("file", new Blob([fileObj])); // 文件对象

      const uploadRequest = new XMLHttpRequest(); // XMLHttpRequest 对象

      uploadRequest.withCredentials = true;
      uploadRequest.open("post", url, true); //post方式，url为服务器请求地址，true 该参数规定请求是否异步处理。
      uploadRequest.setRequestHeader("Authorization", `Basic ${key}`);
      uploadRequest.setRequestHeader("Content-Type", "image/png");
      uploadRequest.onload = (evt) => {
        fileObj.status = "等待下载";
        fileObj.percent = "0%";
        let index = this.uploadlist.indexOf(fileObj);
        this.$set(this.uploadlist, index, fileObj);
        //服务断接收完文件返回的结果
        this.uploadIndex++;
        var data = JSON.parse(evt.target.responseText);
        if (data.output.url) {
          this.downloadFile(data.output.url, fileObj);
        } else {
        }
        if (this.uploadlist.length > this.uploadIndex) {
          this.uploadFile(this.uploadlist[this.uploadIndex]);
        } else {
          this.isbusy = false;
        }
      }; //请求完成
      uploadRequest.onerror = (evt) => {
        fileObj.status = "上传出错";
        this.uploadIndex++;

        if (this.uploadlist.length > this.uploadIndex) {
          this.uploadFile(this.uploadlist[this.uploadIndex]);
        } else {
          this.isbusy = false;
        }
      }; //请求失败

      uploadRequest.upload.onprogress = (evt) => {
        // event.total是需要传输的总字节，event.loaded是已经传输的字节。如果event.lengthComputable不为真，则event.total等于0
        if (evt.lengthComputable) {
          //
          fileObj.percent = Math.round((evt.loaded / evt.total) * 100) + "%";
        } else {
          fileObj.percent = "0%";
        }
        let index = this.uploadlist.indexOf(fileObj);
        this.$set(this.uploadlist, index, fileObj);
      }; //【上传进度调用方法实现】
      uploadRequest.upload.onloadstart = function () {};
      uploadRequest.send(new Blob([fileObj])); //开始上传，发送form数据
      fileObj.status = "上传中";
      fileObj.percent = "0%";
    },

    downloadFile(page_url, file) {
      var that = this;
      var downloadRequest = new XMLHttpRequest();
      let apiKey = store.get("APIKey");
      const key = btoa(`api:${apiKey}`);
      downloadRequest.withCredentials = true;
      downloadRequest.open("POST", page_url, true);
      downloadRequest.setRequestHeader("Content-Type", "application/json");
      downloadRequest.setRequestHeader("Authorization", `Basic ${key}`);

      //监听进度事件
      downloadRequest.addEventListener(
        "progress",
        function (evt) {
          if (evt.lengthComputable) {
            var percentComplete =
              Math.round((evt.loaded / evt.total) * 100) + "%";
            file.percent = percentComplete;
            file.status = "下载中";
            let index = that.uploadlist.indexOf(file);
            that.$set(that.uploadlist, index, file);
          }
        },
        false
      );

      downloadRequest.responseType = "blob";
      var fileObj = file;
      downloadRequest.onreadystatechange = function () {
        if (
          downloadRequest.readyState === 4 &&
          downloadRequest.status === 200
        ) {
          fileObj.status = "下载完成";
          fileObj.percent = "100%";
          let index = that.uploadlist.indexOf(fileObj);
          that.$set(that.uploadlist, index, fileObj);
          var reader = new FileReader();
          reader.onload = function () {
            var buffer = Buffer.from(reader.result);

            if (store.get("origin")) {
              fs.unlinkSync(file.path);
              fs.writeFile(file.path, buffer, {}, (err, res) => {
                if (err) {
                  console.error(err);
                  return;
                }
              });
            } else {
              fs.writeFile(
                store.get("outputPath") + "/" + fileObj.name,
                buffer,
                {},
                (err, res) => {
                  if (err) {
                    console.error(err);
                    return;
                  }
                }
              );
            }
          };
          reader.readAsArrayBuffer(downloadRequest.response); //假设blob已定义,且为MP4视频
        } else {
          fileObj.status = "下载失败";
          let index = that.uploadlist.indexOf(fileObj);
          that.$set(that.uploadlist, index, fileObj);
        }
      };
      downloadRequest.send();
    },
  },
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100vh;
  background-image: linear-gradient(to bottom right, #85c3e0, #3478b6);
  overflow: hidden;
  margin: 0px !important;
}

.bg-container {
  width: 100%;
  height: 378px;
  position: absolute;
  left: 0;
  top: 0;
}

.bg {
  width: 150px;
  height: 150px;
  position: absolute;
  left: 31.25%;
  top: 15%;
}

.bgcontainer {
  width: 100%;
  height: 378px;
  position: absolute;
  overflow: hidden;
}

.bgcontainer-show {
  width: 100%;
  height: 478px;
  position: absolute;
  overflow: hidden;
}

.tip {
  position: absolute;
  color: #b4b4b4;
  font-size: 17px;
  font-weight: bold;
  width: 400px;
  text-align: center;
  top: 60%;
  letter-spacing: 0px;
}

.tool {
  padding: 0px 15px;
  color: white;
  font-size: 15px;
  display: flex;
  width: 370px;
  justify-content: space-between;
  position: absolute;
  left: 0px;
  top: 340px;
}

#setting {
  background: url(./assets/setting.png) no-repeat center center;
  width: 30px;
  height: 30px;
  background-size: 30px 30px;
  cursor: pointer;
}

#folder {
  background: url(./assets/folder.png) no-repeat center center;
  width: 30px;
  height: 30px;
  background-size: 30px 30px;
  cursor: pointer;
  margin-right: 8px;
}

.setting-input {
  position: absolute;
  top: 390px;
  width: 100%;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
}

.key-input {
  width: 200px;
}

.input-container {
  width: 400px;
  height: 28px;
}

.input-title {
  width: 120px;
  display: inline-block;
  text-align: right;
}

.list {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  position: absolute;
}

.lshow {
  display: block;
}

.lhidden {
  display: none;
}

.cell {
  height: 50px;
  width: 380px;
  margin: 5px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mini-img {
  width: auto;
  height: 45px;
}

.upload-status {
  height: 50px;
  line-height: 50px;
  color: white;
  font-size: 13px;
}

.upload-percent {
  height: 50px;
  line-height: 50px;
  color: white;
}
</style>