
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */

  data: {
    chosen: '',
  },

  /**
   * 截取四位小数
   */
  GetFour: function (num){
    return parseFloat(num).toFixed(4);
  },
  
  /**
   * 获取表格日期
   */
  GetDM:function (date){
    return (date.getMonth() + 1) + '/' + date.getDate();
  },

  /* 选择添加或取消自选股票 */
  self_option: function (e) {
    var that = this;
    var code = e.target.id;
    var userId = app.useropenID;
    //若显示为加自选，则点击后的操作为加自选
    if(this.data.chosen == '+加自选') {
      var name = that.data.codes.Name;
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
            //选择成功后需要修改页面上的信息
            var chosen = '已选中';
            //将修改后的结果提交到公共值中
            that.setData({
              chosen: chosen
            });
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
    //若显示为已选中，则点击后的操作为取消自选
    else {
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
            var chosen = '+加自选';
            //将值提交到公共值中
            that.setData({
              chosen: chosen
            });
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

    }
  },
  /* 查看根据输入的id和code改变界面上的选择键的内容 */
  changebutton: function (userId, code) {
    var that = this;
    //获得自选键
    wx.request({
      url: 'http://b283993f0a.c.cloudtogo.cn:25113/checkStock',
      data: {
        userId: userId,
        code: code
      },
      method: 'GET',
      //成功连接
      success: function(res) {

        var result = res.data.result;
        var chosen = '';
        if (result) {
          chosen = '已选中';        
        } else {
          chosen = '+加自选';
        }
        that.setData({
          chosen: chosen
        });
      },
      //连接失败错误提示
      fail: function() {
        wx.showToast({
          title: '连接服务器失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  onLoad: function(options) {
    var that = this;
    var code = wx.getStorageSync('code');
    this.setData({
      code: code
    });
    var userId = app.useropenID;

    wx.request({
      url: 'http://b283993f0a.c.cloudtogo.cn:25113/getStockPredict',
      data: {
        code: code
      },
      method: 'GET',
      success: function(res) {
        var itemArr = res.data;
        //没有股票信息则退出
        if (itemArr == null || itemArr =="") {
          wx.showModal({
            title: '提示',
            content: '暂无此股票信息',
            showCancel: false,
            confirmText: '退出',
            success: function (res) {
              if (res.confirm) {
                // wx.reLaunch({
                //   url: '../homepage/homepage',
                // })
                //跳转回上一级页面
                wx.navigateBack({
                  delta: 1
                })
              }
            }
          })
          return;
        }
        //查询到股票预测信息后开始处理
        var codes = {
          Name: itemArr.name,
          Code: itemArr.code,
          Time: itemArr.date,

          D1H: that.GetFour(itemArr.high1),
          D2H: that.GetFour(itemArr.high2),
          D3H: that.GetFour(itemArr.high3),
          D4H: that.GetFour(itemArr.high4),
          D5H: that.GetFour(itemArr.high5),

          D1l: that.GetFour(itemArr.low1),
          D2l: that.GetFour(itemArr.low2),
          D3l: that.GetFour(itemArr.low3),
          D4l: that.GetFour(itemArr.low4),
          D5l: that.GetFour(itemArr.low5),

          loss: itemArr.loss,
        };
        //算出预测日期
        codes.Time = new Date(codes.Time);
        var day1 = new Date(codes.Time);
        var day2 = new Date(codes.Time);
        var day3 = new Date(codes.Time);
        var day4 = new Date(codes.Time);
        var day5 = new Date(codes.Time);

        //对接下来五天进行判断，跳过周六日
        day1 = that.getTomorrow(codes.Time, day1);    
        day2 = that.getTomorrow(day1, day2);
        day3 = that.getTomorrow(day2, day3);
        day4 = that.getTomorrow(day3, day4);
        day5 = that.getTomorrow(day4, day5);
        var days = {
          day1: that.GetDM(day1),
          day2: that.GetDM(day2),
          day3: that.GetDM(day3),
          day4: that.GetDM(day4),
          day5: that.GetDM(day5)
        };

        that.setData({
          imageUrl: "http://b283993f0a.c.cloudtogo.cn:25113/" + codes.Code + ".png",
          codes: codes,
          days: days
        });
        that.changebutton(userId, code);
      },
      //连接失败提示
      fail: function() {
        wx.showToast({
          title: '查询股票失败，请返回重试',
          icon: 'none',
          duration: 2000
        })
      }
    })

  },
  //跳过周六日
  getTomorrow: function (today, tomorrow) {
    if (today.getDay() == 5) {
      // tomorrow.setDate(today.getDate() + 3);
      tomorrow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    }
    else {
      console.log(today, today.getDate());
      // tomorrow.setDate(today.getDate() + 1);
      tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      console.log('1:' + tomorrow);
    }
    return tomorrow;
  },
})