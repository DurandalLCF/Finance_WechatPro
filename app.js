App({

  globalData:{
    useropenID: '',
    Code:[],
    likeCode: [],
  },
  data: {
    appId: 'wxd82f4a9a8c8b7d64',
    secret: 'fb0c1d510d45955970aca9b8bae72449',
    url: 'https://api.weixin.qq.com/sns/jscode2session',
  },

  /* 页面预加载 */
  onLaunch: function() {
    var that = this;

    //登录并获得用户openId以及所有股票信息
    wx.login({
      success:function(res) {
        if(res.code) {
          var data = that.data;
          var url = data.url + '?appid=' + data.appId +'&secret=' + data.secret + '&js_code=' + res.code + '&grant_type=authorization_code'; 
          //获得用户openId
          wx.request({
            url: url,
            data: {},
            method: 'GET',
            success: function(res) {
              that.useropenID = res.data.openid;
              //由于这里是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (that.useropenIDCallback) {
                that.useropenIDCallback(res.data);
              }
            },
            fail: function() {
              wx.showToast({
                title: '获取用户信息失败，请重试',
                icon: 'none',
                duration: 2000
              })
            } 
          });
          //获得所有股票信息
          wx.request({
            url: 'http://b283993f0a.c.cloudtogo.cn:25113/getAllStocks',
            data: {},
            method: 'GET',
            success:function(res) {
              var iterm = res.data;
              var allCode = [];
              for(var i = 0; i < iterm.length; i ++) {
                allCode[i] = {code: iterm[i].code, name: iterm[i].name, letter: iterm[i].spell};
              }
              that.Code = allCode;
            },
            fail: function() {
              wx.showToast({
                title: '获取股票信息失败，请重试',
                icon: 'none',
                duration: 2000
              })
            }
          });
        } else {
          wx.showToast({
            title: '登录失败:' + res.errMsg,
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: function() {
        wx.showToast({
          title: '服务器正在维护中...',
          icon: 'none',
          duration: 3000
        })
      } 
    })
  }
})