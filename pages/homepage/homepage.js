const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    pageJump: true,
    popErrorMsg: '',
    code20: [],
    //top20的代码映射表
    indexCode20: [],
    show20: true,
    userInput: '',
    clearInput: '',
    inputPlace: '',
    titleTips: '',
    showCode: [],
    //搜索结果代码的代码映射表
    indexShowCode: [],
    floorStatus: false,
    //自选股
    likeCode: []
  },

  /* 点击股票跳转到预测页面 */
  touch_choose: function (e) {
    // 设置后加自选则不会发生跳转
    if (this.data.pageJump) {
      var id = e.currentTarget.dataset.select;
      wx.setStorageSync('code', id);
      wx.navigateTo({
        url: '../get/get',
      })

    }
    this.setData({
      pageJump: true
    });
  },

  /* 添加或取消用户自选股 */
  self_option: function (e) {
    var userId = app.useropenID;
    // 点击+自选按钮后页面不跳转
    this.setData({
      pageJump: false
    });
    var that = this;
    //获取请求id，id又股票代码和股票是否自选组成
    var requireId = e.target.id;
    //获取股票代码
    var code = requireId.slice(0, 6);
    //判断是top20还是搜索结果
    var show20 = requireId.slice(6, requireId.length);
    var indexCodes = [];
    var codes = [];
    var flag = false;
    if (show20 == 'true') {
      indexCodes = this.data.indexCode20;
      codes = this.data.code20;
      show20 = true;
    } else {
      indexCodes = this.data.indexShowCode;
      codes = this.data.showCode;
      show20 = false;
    }
    //通过indexOf获得请求股票在映射表中的下标
    var i = indexCodes.indexOf(code);
    if (codes[i].chosen == '已选中') {
      flag = true;
    }
    //获得下标后通过chosen的布尔值判断是添加自选还是取消自选
    if (flag) {
      //取消自选
      wx.request({
        url: 'http://b283993f0a.c.cloudtogo.cn:25113/deleteStock',
        data: {
          userId: userId,
          code: code
        },
        method: 'GET',
        success: function (res) {
          //对java返回值进行判断，是否成功操作数据库
          var result = res.data.result;
          if (result == "取消自选成功") {
            wx.showToast({
              title: result,
            });
            //成功操作后，需要修改页面上的信息
            codes[i].chosen = '+自选';
            var likeCode = that.data.likeCode;
            //数组移除元素
            likeCode.splice(likeCode.indexOf(codes[i].code), 1);
            if (show20) {
              //将值提交到公共值中
              that.setData({
                code20: codes,
                likeCode: likeCode
              });
            } else {
              that.setData({
                showCode: codes,
                likeCode: likeCode
              })
            }
            app.globalData.likeCode = likeCode;

          } else {
            //成功连接了java但是操作数据库失败
            wx.showToast({
              title: result,
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: function () {
          wx.showToast({
            title: '连接服务器超时...',
            icon: 'none',
            duration: 2000
          })
        }
      })
    } else {
      //加自选需要获得股票的名称
      var name = codes[i].name;
      //加自选
      wx.request({
        url: 'http://b283993f0a.c.cloudtogo.cn:25113/addStock',
        data: {
          userId: userId,
          code: code,
          name: name
        },
        method: 'GET',
        success: function (res) {
          var result = res.data.result;
          //添加自选股成功
          if (result == "添加自选成功") {
            wx.showToast({
              title: result,
            });
            //成功操作后，需要修改页面上的信息
            codes[i].chosen = '已选中';
            var likeCode = that.data.likeCode;
            likeCode[likeCode.length] = codes[i].code;
            if (show20) {
              //将值提交到公共值中
              that.setData({
                code20: codes,
                likeCode: likeCode
              });
            } else {
              that.setData({
                showCode: codes,
                likeCode: likeCode
              })
            }
            app.globalData.likeCode = likeCode;
          } else {
            //成功连接服务器但是操作数据库失败
            wx.showToast({
              title: result,
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: function () {
          //连接java服务器失败
          wx.showToast({
            title: '连接服务器超时...',
            icon: 'none',
            duration: 2000
          })
        }
      })
    }

  },

  /* 页面加载函数 */
  load: function (userId) {
    this.get_code20(userId);
    var welcomeTest = {
      inputPlace: "请输入代码 / 名称  / 首字母",
      titleTips: '访问频率 TOP 20',
      show20: true,
    }
    this.setData(welcomeTest);
  },
  /**
   * 页面获得访问频率为前20的股票
   */
  get_code20: function (userId) {
    var that = this;
    wx.request({
      url: 'http://b283993f0a.c.cloudtogo.cn:25113/getStockTop20',
      data: {
        userId: userId
      },
      method: 'GET',
      success: function (res) {
        var itemArr = res.data;
        var code20 = [];
        var indexCode20 = [];
        for (var i = 0; i < itemArr.length; i++) {
          if (itemArr[i].chosen) {
            code20[i] = { code: itemArr[i].code, name: itemArr[i].name, chosen: '已选中' };
            indexCode20[i] = itemArr[i].code;
          }
          else {
            code20[i] = { code: itemArr[i].code, name: itemArr[i].name, chosen: '+自选' };
            indexCode20[i] = itemArr[i].code;
          }
        }
        that.setData({
          code20: code20,
          indexCode20: indexCode20
        });
      },
      fail: function () {
        wx.showToast({
          title: '服务器连接超时...',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 回到顶部按钮
   */
  go_top: function (e) {
    this.setData({
      scrollTop: 0
    });
  },

  /**
   * 上下滑动显示或取消回到顶部按钮
   */
  scroll: function (e, res) {
    if (e.detail.scrollTop > 400) {
      this.setData({
        floorStatus: true
      })
    } else {
      this.setData({
        floorStatus: false
      })
    }
  },

  /**
   * 输入框显示不同可选股票
   */
  input_code: function (e) {
    
    var showCode = [];
    // 用户输入字段
    var tmpCode = e.detail.value;
    this.setData({
      show20: false,
      titleTips: '搜索结果',
      userInput : tmpCode
    });
    //数字正则表达式
    var reg = new RegExp('[0-9]');
    //字母正则表达式
    var regWord = new RegExp('[a-zA-Z]');
    if (tmpCode.length == 0) {
      this.setData({
        userInput: '',
        titleTips: '访问频率 TOP 20',
        inputPlace: "请输入代码 / 名称  / 首字母",
        showCode: [],
        show20: true
      })
      return;
    }
    // 正则表达式进行判断
    if (reg.test(tmpCode)) {
      // 判断结果为数字
      showCode = this.check_num(tmpCode);
    } else if (regWord.test(tmpCode)) {
      showCode = this.check_letter(tmpCode.toUpperCase());
    } else {
      showCode = this.check_name(tmpCode);
    }
    if (showCode == null) {
      wx.showToast({
        title: '输入信息有误',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    this.setData({
      showCode: showCode
    })
  },

  /**
   * 输入代码查找股票
   */
  check_num: function (code) {
    var flag = true;
    var resultCode = [];
    var indexShowCode = [];
    var showCode = app.Code;
    var count = 0;
    for (var i = 0; i < showCode.length; i++) {
      var data = showCode[i].code;
      if (data == null) {
        continue;
      }
      //去空格
      code = code.replace(/\s*/g, "");
      //判断代码的前半部分是否为输入字符串
      flag = (data.slice(0, code.length) == code);
      if (flag) {
        var chosen = '+自选';
        if (this.data.likeCode.indexOf(showCode[i].code) != -1) {
          chosen = '已选中';
        }
        var d = count++;
        // 记录结果并保存
        resultCode[d] = {
          code: showCode[i].code,
          name: showCode[i].name,
          chosen: chosen
        }
        indexShowCode[d] = showCode[i].code;
        if (d > 300) {
          break;
        }
      }
    }
    this.setData({
      indexShowCode: indexShowCode
    });

    return resultCode;
  },

  /**
   * 输入首字母查找股票
   */
  check_letter: function (letter) {
    var count = 0;
    var resultCode = [];
    var indexShowCode = [];
    var flag = true;
    var showCode = app.Code;

    for (var i = 0; i < showCode.length; i++) {
      var data = showCode[i].letter;
      if (data == null) {
        continue;
      }
      //去空格
      letter = letter.replace(/\s*/g, "");
      //判断是否存在
      flag = (data.slice(0, letter.length) == letter);
      if (flag) {
        var chosen = '+自选';
        if (this.data.likeCode.indexOf(showCode[i].code) != -1) {
          chosen = '已选中';
        }
        var d = count++;
        // 记录结果并保存
        resultCode[d] = {
          code: showCode[i].code,
          name: showCode[i].name,
          chosen: chosen
        }
        indexShowCode[d] = showCode[i].code;
      }
      flag = true;
    }
    this.setData({
      indexShowCode: indexShowCode
    })
    return resultCode;
  },

  /**
   * 输入名字查找股票
   */
  check_name: function (name) {
    var count = 0;
    var resultCode = [];
    var indexShowCode = [];
    var flag = true;
    var showCode = app.Code;
    for (var i = 0; i < showCode.length; i++) {
      var data = showCode[i].name;
      if (data == null) {
        continue;
      }
      var k = 0;
      //去空格
      name = name.replace(/\s*/g, "");
      //判断是否为子串
      flag = (data.slice(0, name.length) == name);
      if (flag) {
        var chosen = '+自选';
        if (this.data.likeCode.indexOf(showCode[i].code) != -1) {
          chosen = '已选中';
        }
        var d = count++;
        // 记录结果并保存
        resultCode[d] = {
          code: showCode[i].code,
          name: showCode[i].name,
          chosen: chosen
        }
        indexShowCode[d] = showCode[i].code;
      }
      flag = true;
    }
    this.setData({
      indexShowCode: indexShowCode
    })
    return resultCode;
  },

  /**
   * 清空输入框内容
   */
  clear_input: function () {
    this.setData({
      userInput: '',
      clearInput: '',
      titleTips: '访问频率 TOP 20',
      showCode: [],
      show20: true
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var userId = '';
    if (app.useropenID && app.useropenID != '') {
      userId = app.useropenID;
      this.getLikeCode(userId);
      this.load(userId);
    } else {
      app.useropenIDCallback = useropenID => {
        if (useropenID != '') {
          userId = app.useropenID;
          this.getLikeCode(userId);
          this.load(userId);
        }
      }
    }

  },

  /**
   * 获得用户自选股列表，用于展示
   */
  getLikeCode: function (userId) {
    var that = this;
    wx.request({
      url: 'http://b283993f0a.c.cloudtogo.cn:25113/getStockById',
      data: {
        userId: userId
      },
      method: 'GET',
      //连接服务器成功
      success: function (res) {
        var itemArr = res.data;

        var likeCode = [];
        //判断返回信息是否为空
        if (itemArr != null) {
          //将获得的自选股信息填到Code中
          for (var i = 0; i < itemArr.length; i++) {
            likeCode[i] = itemArr[i].code;
          }
          that.setData({
            likeCode: likeCode
          });
          app.globalData.likeCode = likeCode;
        } else {
          //当java获取数据库信息失败时的错误提示信息
          wx.showToast({
            title: '获取自选股信息失败',
            icon: 'none',
            duration: 2000
          });
          return;
        }
      },
      //连接服务器失败的错误提示
      fail: function () {
        wx.showToast({
          title: '连接服务器超时...',
          icon: 'none',
          duration: 2000
        });
        return;
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      userInput: '',
      clearInput: ''
    })
    this.load(app.useropenID);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})