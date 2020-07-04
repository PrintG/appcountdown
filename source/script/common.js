//公用JS，返回公用的功能函数
define(["apijs","fastClick","json2"],function($,FastClick){

  var _common = {};

  FastClick.attach(document.body);


  //公用配置
  _common.config = {
    loginOverdueCode: 401,  //登录过期返回的状态码
  };

  //判断是否登录,返回值 true => 登陆了   false => 未登录
  //参数：
  /*
    toLoginPage =>
        布尔值 => 未登录时是否打开登陆页（布尔值，默认true），传flase则代表不打开登录页，
        对象 => 传一个对象则代表是 api.openWin 中的窗口参数对象，会打开该窗口
                    代表登陆后跳转的页面对象，会使用api.openWin打开，因此这个参数对象参考 openWin 的参数对象(不传的话则不会跳转)
        数字 => 代表当前模块索引，需要要刷新当前模块(如 购物车、个人)

    loginUrl => (可选)
      登录页相对调用页面的地址，一般仅有最顶级的index页需要传入
  */



  _common.verLogin = function(toLoginPage, loginUrl){
    if(toLoginPage !== false && typeof toLoginPage !== "object" && typeof toLoginPage !== "number"){
      toLoginPage = true;
    }

    loginUrl = loginUrl || '../login/login.html';

    var loginToken = $api.getStorage("token");

    if( loginToken == null || loginToken == undefined ){

        if(typeof toLoginPage == 'number'){
          api.openWin({
            name: 'login',
            url: loginUrl,
            pageParam: {
              winObj: toLoginPage,
            }
          });
        }
        return false;
    }else{
      return true;
    }
  }
  // 退出登录清除token以及用户信息
  _common.loginOut = function(){
    $api.clearStorage("token");
  }


  // 发起ajax请求
  // 其他参数常规，仅有特殊参数如下说明：
  //      sendToken => 是否在请求时带入token(默认 true， 一般仅登录不需要带入token)
  //      loading => 是否需要显示加载中遮罩层（默认false, 传true则显示)
  //      closeErrorAlert => 是否关闭请求出错时的提示（默认false不关闭）
  _common.req = function(options){
    options.loadingText = options.loadingText || {};

    var url = options.url,
        method = options.method || "GET",
        headers = options.headers || {},
        data = options.data || {},
        sucFn = options.success,
        errFn = options.error,
        compFn = options.complete,
        closeErrorAlert = options.closeErrorAlert,
        loadingShow = options.loading,
        sendToken = options.sendToken;


    var token = $api.getStorage("token");

    if(sendToken === undefined){
      sendToken = true;
    }
    if(sendToken === true){
      headers.token = token;
    }

    // setTimeout(function(){
    //   api.showProgress({
    //     title: loadingText.title,
    //     text: loadingText.text
    //   });
    // },30);



    //如果是post请求，则添加请求头类型并把数据转为JSON字符串
    if( /post/i.test(method)){
      headers["Content-Type"] = "application/json; charset=UTF-8";
      data = {
        body: JSON.stringify(data)
      }
    }

    if(loadingShow){
      _common.showLoading();
    }

    api.ajax({
      url: "http://a.rayanskin.cc/"+url,
      method: method,
      data: data,
      headers: headers,
      dataType: "json",
    }, function(ret,err){
      if(ret){
        if(ret.code == 401){
          api.toast({
              msg: '登录信息已过期，请重新登录！（稍后自动跳回首页）',
              duration: 3000
          });

          //清除token
          _common.loginOut();

          setTimeout(function(){

            //关闭所有窗口
            api.closeToWin({
              name: 'root'
            });

            //重载主页面
            api.execScript({
              name: "root",
              script: "reloadPage()"
            });

          },3000);


          return;


        }

        // 2032 为微信登录未绑定手机号
        if(ret.code == 200 || ret.code == 2032){
          sucFn && sucFn(ret);
        }else{
          if(!closeErrorAlert){
            api.toast({
                msg: "请求出错！原因："+ret.desc,
                duration: 3000,
                location: 'bottom'
            });

          }
          errFn && errFn(ret.desc);
        }

      }else{
        if(!closeErrorAlert){
          if(err){
            api.toast({
                msg: "请求出错！原因："+err.msg,
                duration: 3000,
                location: 'bottom'
            });
          }
        }
        errFn && errFn(err.msg);

      }

      // api.hideProgress();

      if(loadingShow){
        _common.closeLoading();
      }

      compFn && compFn(ret, err);

    });

  }


  //显示、移除加载框
  _common.showLoading = function(){
    var oBody = $api.dom("body");

    var domstr = '<div class="c-loading-mask" style="height:'+$api.getStorage('winHeight')+'px;">'+
                  '<div class="c-loading-content">'+
                    '<img src="../../image/loading.gif" alt="">'+
                    '<p>正在请求中...</p>'+
                  '</div>'+
                '</div>';

    $api.append(oBody, domstr);
  }
  _common.closeLoading = function(){
    $api.remove($api.dom(".c-loading-mask"));
  }
  /*========================= 页面操作类函数 ======================*/
  // 遍历元素
  // el => 需要遍历的元素数组    callback => 遍历回调函数，接收两个参数  el,index
  _common.eachDom = function(els, callback){
    var elsLen = els.length;
    for(var i = 0; i < elsLen; i++){
      if( callback(els[i],i) === true ){
        break;
      };
    }
  }



  /*========================= 工具类类函数 ======================*/
  // 判断值是否不为空
  // str => 要判断的值   返回 true => 不为空   false => 为空
  _common.noEmpty = function(str){
    if(str == "" || str == null || str == undefined){ return false; }
    return !/^\s*$/.test(str);
  }
  // 数字补零函数
  _common.toTwo = function(num){
    return num>9?''+num:'0'+num;
  }
  //封装简易toast
  _common.toast = function(content){
    api.toast({
        msg: content,
        duration: 2000,
        location: 'bottom'
    });

  }
  //解决小数点问题
  _common.regFloatCalcMethod = function(){
    window.floatCalc = function (a, b) {
        a = a + '', b = b + '';
        var aNum = a.indexOf('.'),
            bNum = b.indexOf('.'),
            aSum,
            bSum,
            resultNum,
            inta,
            intb;

        aSum = aNum < 0 ? 0 : a.split('.')[1].length;
        bSum = bNum < 0 ? 0 : b.split('.')[1].length;
        resultNum = aSum > bSum ? aSum : bSum;

        inta = aNum < 0 ? Number(a + (Math.pow(10, resultNum) + '').replace('1', '')) : (function () {
            a = a.replace('.', '');
            a = resultNum == aSum ? a : a + (Math.pow(10, resultNum - aSum) + '').replace('1', '');
            return Number(a);
        }())

        intb = bNum < 0 ? Number(b + (Math.pow(10, resultNum) + '').replace('1', '')) : (function () {
            b = b.replace('.', '');
            b = resultNum == bSum ? b : b + (Math.pow(10, resultNum - bSum) + '').replace('1', '');
            return Number(b);
        }())

        return {
            a: inta,
            b: intb,
            num: resultNum
        };
    }
    //加法
    Number.prototype.add = function (n) {
        var o = floatCalc(this, n);
        return (o.a + o.b) / Math.pow(10, o.num);
    }
    //减法
    Number.prototype.minus = function (n) {
        var o = floatCalc(this, n);
        return (o.a - o.b) / Math.pow(10, o.num);
    }
    //乘法
    Number.prototype.subtract = function (n) {
        var o = floatCalc(this, n);
        return (o.a * o.b) / Math.pow(10, o.num * 2);
    }
    //除法
    Number.prototype.divide = function (n) {
        var o = floatCalc(this, n);
        return (o.a / o.b);
    }
  }
  _common.regFloatCalcMethod();  //给全部页面注册该方法

  _common.checkUpdate = function(notCallback){
    var mam = api.require('mam');
    mam.checkUpdate(function(ret,err){
      if(ret){
        var result = ret.result;

        if(result.update == true && result.closed == false){
          api.openFrame({
              name: 'checkUpdate',
              url: '../other/check_update.html',
              pageParam: {
                  result: result
              },
              bgColor: "rgba(0,0,0,0.6)",
              animation: {
                type:"none",
              }
          });

        }else{
          notCallback && notCallback();
        }
      }
    });

  }
  //*========================= 公用组件类函数(公用元素事件注册) ====================== *//
  //注册增减数字控件事件
  // callback(el, count, type) => 数值发生改变的时候调用该函数，并把元素、改变后的数值、变化类型（1增加，2减少） 传入该函数 （可选）
  // maxNumber => 最大增加数量
  // 所有使用的部分都需要传入maxNumber
  _common.regNumberUpDownEvent = function(callback,maxNumber){
    maxNumber = maxNumber || 100;

    var oControls = $api.domAll(".c-numberUpDwon-controls");

    _common.eachDom(oControls, function(el){
      if($api.hasCls(el, "disabled")){
        return;
      }

      var oAdd = $api.dom(el,".controls-add"),
          oReduce = $api.dom(el, ".controls-reduce"),
          oCount = $api.dom(el,".goods-count");


      //移除事件，避免再次注册时出现多个事件
      if(window.regNumberUpDownEventAddClickEvent){
        $api.rmEvt(oAdd, 'click',window.regNumberUpDownEventAddClickEvent);
        $api.rmEvt(oReduce, 'click',window.regNumberUpDownEventReduceClickEvent);
      }

      //每次注册事件将count改为1
      // $api.text(oCount, '1');


      window.regNumberUpDownEventAddClickEvent = function(){
        var count = getCount();

        //没有超过则可以继续添加
        if( count < maxNumber ){
          $api.text(oCount, count+1);

          typeof callback === "function" && callback(oCount,count+1,1);


          $api.addCls(oReduce,'active');
        }

        //等于最大值后则改为禁用样式
        if( getCount() >= maxNumber ){
          $api.removeCls(this,'active');
        }
      }

      window.regNumberUpDownEventReduceClickEvent = function(){
        var count = getCount();

        //商品数量必须大于1才可以减少
        if( count > 1 ){
          $api.text(oCount, count-1);

          typeof callback === "function" && callback(oCount,count-1,2);
        }

        //等于1后则改为禁用样式
        if( getCount() <= 1 ){
          $api.removeCls(this,'active');
        }
        //如果小与最大值则移除禁用样式
        if( getCount() < maxNumber ){
          $api.addCls(oAdd,'active');
        }
      }



      //增加
      $api.addEvt(oAdd, 'click', window.regNumberUpDownEventAddClickEvent);
      //减少
      $api.addEvt(oReduce, 'click', window.regNumberUpDownEventReduceClickEvent);

      //获取数量并转为数字
      function getCount(){
        return +$api.text(oCount);
      }

    });
  }

  //注册点击商品列表购物车事件
  _common.regShopListCarEvent = function(){
    var oShopCarBtn = $api.domAll(".c-goods-buybtn");

    _common.eachDom(oShopCarBtn,function(el){
      $api.addEvt(el, 'click', function(e){
        e.stopPropagation();
        openShopCarWin( $api.attr(el, "data-spuid") );
      });
    });
    function openShopCarWin(spuid){
      var oJoinShopCar = $api.dom(".c-popwin-joinshopcar");

      if(oJoinShopCar === null){
        //没有购物车弹窗元素
        var oBody = $api.dom("body");

        var domStr = '<div class="c-popwin-joinshopcar show">'+
          '<div class="wrap c-hide">'+
            '<div class="close-wrap clearfix">'+
              '<i class="iconfont icon-guanbi"></i>'+
            '</div>'+
            '<div class="title">商品名称</div>'+
            '<div class="c-goods-spec-wrap">'+
              '<h4>规格</h4>'+
              '<div class="spec-list clearfix">'+
                '<div class="spec-item active">默认</div>'+
              '</div>'+
            '</div>'+
            '<div class="c-goods-count-wrap clearfix">'+
              '<h4>购买数量</h4>'+
              '<div class="c-numberUpDwon-controls">'+
                '<span class="iconfont icon-jiansvg controls-reduce"></span>'+
                '<span class="goods-count">1</span>'+
                '<span class="iconfont icon-jia controls-add active"></span>'+
              '</div>'+
            '</div>'+
            '<div class="bottom clearfix">'+
              '<div class="price">￥0.00</div>'+
              '<div class="join-btn">加入购物车</div>'+
            '</div>'+
          '</div>'+
          '<div class="loading-wrap">'+
              '<div class="c-loadfont">正在加载中</div>'+
              '<img src="../../image/shopcart/loading.png">'
          '</div>'+
        '</div>';
        $api.append(oBody, domStr);
        //获取商品信息并填入
        setGoodsInfo(spuid, 0);

      }else{
        //有购物车弹窗元素
        var oWrap = $api.dom(oJoinShopCar,".wrap");
        var oLoadingWrap = $api.dom(oJoinShopCar,".loading-wrap");
        $api.addCls(oWrap, 'c-hide');
        $api.removeCls(oLoadingWrap, 'c-hide');

        $api.addCls(oJoinShopCar, 'show');
        //清除数量
        var oCount = $api.dom(oJoinShopCar, ".goods-count");
        $api.text(oCount, '1');

        setGoodsInfo(spuid,1);
      }


      //type => 类型， 0=没有购物车弹窗元素  1=有购物车弹窗元素
      function setGoodsInfo(spuId, type){
        var canReqAddCart = true; //是否能加入到购物车当中

        //获取商品信息
        _common.reqGetGoodsDetail(spuId, function(data){
          var oJoinShopCar = $api.dom(".c-popwin-joinshopcar"),
              oTitle = $api.dom(oJoinShopCar,".title"),
              oSpecList = $api.dom(oJoinShopCar,".spec-list"),
              oPrice = $api.dom(oJoinShopCar,".price"),
              oJoinBtn = $api.dom(oJoinShopCar,".join-btn"),
              oNum = $api.dom(oJoinShopCar,".c-goods-count-wrap .goods-count");

          var oWrap = $api.dom(oJoinShopCar,".wrap");
          var oLoadingWrap = $api.dom(oJoinShopCar,".loading-wrap");

          $api.addCls(oLoadingWrap, 'c-hide');
          $api.removeCls(oWrap, 'c-hide');


          $api.text(oTitle, data.productName);
          $api.text(oPrice, "￥"+data.skuList[0].price);
          $api.attr(oJoinBtn,"data-skuid",data.skuList[0].skuId);

          if(data.specType == 1){
            //单规格商品
            $api.html(oSpecList, '<div class="spec-item active">默认</div>');
          }else{
            //多规格商品
            var specListStr = "";
            var firstSpecIndex = 0;
            var skuList = data.skuList;
            for(var i = 0; i < skuList.length; i++){
              if(skuList[i].skuSpecRelList.length == 0){
                firstSpecIndex = 1;
                continue;
              }
              specListStr += '<div class="spec-item '+(i==firstSpecIndex?"active":"")+'" data-skuid="'+skuList[i].skuId+'" data-index="'+i+'">'+skuList[i].skuSpecRelList[0].specValueName+'</div>';
            }
            $api.html(oSpecList, specListStr);

            //注册规格选择事件
            var curSpecIndex = 0;  //当前选中的规格索引
            var oSpecItem = $api.domAll(oSpecList, ".spec-item");
            _common.eachDom(oSpecItem, function(el,i){

              $api.addEvt(el, 'click', function(){
                var el_index = $api.attr(this, "data-index");

                $api.removeCls(oSpecItem[curSpecIndex], "active");

                $api.addCls(this, "active");
                curSpecIndex = i;

                //更新内容显示
                var goodsinfo = skuList[el_index];
                $api.text(oPrice, "￥"+goodsinfo.price);
                $api.attr(oJoinBtn,"data-skuid",goodsinfo.skuId);

              });

            });
          }
          //不变动的元素仅需要注册一次事件即可
          if(type == 0){
            //注册数字控件事件
            _common.regNumberUpDownEvent();
            //注册关闭事件
            var oClose = $api.dom(oJoinShopCar,".close-wrap i");
            $api.addEvt(oClose, 'click', function(){
              $api.removeCls(oJoinShopCar, 'show');
            });
            //注册加入购物车事件
            $api.addEvt(oJoinBtn, 'click', function(){
              var _skuId = $api.attr(this,"data-skuid"),
                  _num = +$api.text(oNum);

              if(!_common.verLogin(false)){
                api.toast({
                    msg: '登录后可进行加入购物车操作！',
                    duration: 2000,
                    location: 'bottom'
                });
                return;
              }

              if(canReqAddCart){
                canReqAddCart = false;
                _common.req({
                  url: "openapi/shopping/shopping/add",
                  method: "POST",
                  loading: true,
                  data: {
                    num: _num,
                    skuId: _skuId,
                  },
                  success: function(data){
                    api.toast({
                        msg: '已加入购物车！',
                        duration: 2000,
                        location: 'bottom'
                    });
                  },
                  complete: function(){
                    canReqAddCart = true;
                  }
                });

              }else{
                api.toast({
                    msg: '正在加入购物车中，请耐心等待...',
                    duration: 2000,
                    location: 'bottom'
                });

              }
            });


          }

        });

      }
    }

  }

  //注册图片上传事件 config => 相关参数，参考如下
  /*
      count => (可选)上传数量，默认1
      callback(urls) => (可选)每当图片上传完成后、删除后都会调用该函数，并传入已上传的图片url
  */
  _common.regPicUpload = function(config){
    var _count = config.count || 1,
        _callback = config.callback;

    var _uploadCount = 0; //当前上传数量


    var oPicUpload = $api.dom(".pic-upload"),
        oPicUploadWarp = $api.dom(oPicUpload,".pic-upload-warp"),
        oPicUploadControls = $api.dom(".pic-upload-controls");

    var oUrls = [];


    //点击上传图片
    $api.addEvt(oPicUploadControls, 'click', function(){
      if(oUrls.length >= _count){
        api.toast({
            msg: '不能上传更多图片了！',
            duration: 2000,
            location: 'bottom'
        });

        return;
      }
      api.getPicture({
        sourceType: 'library',
        encodingType: 'jpg',
        mediaValue: 'pic',
        destinationType: 'base64',
        allowEdit: true,
        quality: 50,
        saveToPhotoAlbum: false
      }, function(ret, err) {
        if (ret.base64Data) {
          reqUploadImg(ret.base64Data, insertUploadItemEl(ret.base64Data));
        } else {
          api.toast({
              msg: '选择图片失败！请稍后重试',
              duration: 2000,
              location: 'bottom'
          });

        }
      });
    });

    //插入相关元素
    function insertUploadItemEl(data_base64){
      var randomId = "imgupload_"+Number(Math.random().toString().substr(3,length) + Date.now()).toString(36);

      var _html = $api.html(oPicUploadWarp);

      var domstr = '<div class="pic-upload-item uploading" id="'+randomId+'">'+
                     '<div class="wrap">'+
                       '<img class="img-fillparent" src="'+data_base64+'">'+
                       '<div class="mask">'+
                         '<p class="upload-tip">上传中</p>'+
                       '</div>'+
                     '</div>'+
                   '</div>';

      $api.html(oPicUploadWarp, _html+domstr);

      return $api.dom("#"+randomId);

    }

    //上传图片
    var canUpload = true;
    function reqUploadImg(data_base64, el){
      var oImg = $api.dom(el, "img"),
          oTip = $api.dom(el, ".upload-tip");

      $api.attr(oImg, 'src', data_base64);


      if(!canUpload){
        api.toast({
            msg: '当前正在有图片上传中,请等待其上传完成',
            duration: 2000,
            location: 'bottom'
        });
        return;
      }

      canUpload = false;
      _common.req({
        url: "openapi/file/upload/batch",
        method: "POST",
        data: [
          {
            base64: data_base64
          }
        ],
        success: function(data){
          data = data.data;

          //上传成功
          oUrls.push(data[0]);

          $api.attr(el, 'data-url', data[0]);
          $api.text(oTip, '');

          $api.removeCls(el, 'uploading');
          $api.addCls(el, 'success');



          _callback && _callback(oUrls);

        },
        error: function(){
          //上传失败也移除该元素
          $api.remove(el);
        },
        complete: function(){
          canUpload = true;
        }
      });
    }



    //点击已上传的图片则提示删除
    $api.addEvt(oPicUploadWarp, 'click', function(e){
      var oTargetEl = e.target;
      if(!$api.hasCls(oTargetEl, 'pic-upload-item')){
        oTargetEl = $api.closest(oTargetEl, '.pic-upload-item');
      }

      if($api.hasCls(oTargetEl, 'success')){
        //点击删除
        api.confirm({
          title: '系统提示',
          msg: '确定要移除该图片吗',
          buttons: ['确定', '取消']
        }, function(ret, err) {
          var index = ret.buttonIndex;

          if(index == 1){
            //确定

            //获取当前url
            var _url = $api.attr(oTargetEl, 'data-url');
            //遍历移除相关url
            for(var i = 0; i < oUrls.length; i++){
              if(oUrls[i] == _url){
                oUrls.splice(i,1);
                break;
              }
            }

            //顺便将该元素移除
            $api.remove(oTargetEl);


            _callback && _callback(oUrls);

          }else{
            //取消
          }
        });
      }

    });



  }


  //*========================= 公用请求类(多页面用到的请求) ====================== *//
  // 根据spuid获取商品信息
  _common.reqGetGoodsDetail = function(spuid, success){
    this.req({
      url: "openapi/product/product/detail/"+spuid,
      loadingText: {
        title: "获取商品信息中..."
      },
      success: function(data){
        data = data.data;
        success && success(data);
      }
    });
  }


  // 创建订单
  // data => 相关参数，格式如下    callback => 创建成功时的回调
  /*
    {
      addressId: 1,   //用户收货地址id
      merchants: {
        merchantId: 1,  //商户ID
        userMessage: "",  //备注
        skuList: [
          {
            skuId: 66,  //skuid
            num: 2  //数量
          }
        ]
      }
    }
  */
  _common.createOrder = function(data,callback){
    this.req({
      method: "POST",
      data: data,
      loading: true,
      success: function(data){
        callback && callback(data);
      },
      error: function(){
        api.toast({
            msg: '创建订单失败',
            duration: 2000,
            location: 'bottom'
        });

      }
    });
  }

  // 支付订单
  // data =>
  //    orderno => 订单编号  parentWinName => 调用页面的名称  pageType => 窗口类型 (frame window(默认))
  //callback => 支付成功的回调
  _common.payOrder = function(data,callback){
    var orderno = data.orderno,
        parentWinName = data.parentWinName,
        pageType = data.pageType;

    pageType = pageType || 'window';
    //打开输入密码页面
    var oMask = $api.dom(".c-mask");
    api.openFrame({
        name: 'payPass',
        url: '../security/paypassword.html',
        pageParam: {
          parentWinName: parentWinName,
          pageType: pageType
        },
        bgColor: 'rgba(0,0,0,0)',
        animation: {
          type: 'movein',
          subType: 'from_bottom'
        }
    });
    $api.addCls(oMask, 'show');
    window.closeCMask = function(){
      $api.removeCls(oMask, 'show');
      api.closeFrame({
          name: 'payPass'
      });
    }
    var canPayOrder = true;
    window.payOrder = function(password){
      var signature = api.require('signature');

      if(!canPayOrder){
        api.toast({
            msg: '正在支付中...',
            duration: 2000,
            location: 'bottom'
        });
        return;
      }
      canPayOrder = false;
      //加密处理
      signature.md5({
          data: password+"KJ1lTKjHinbv4%MZPT%GvAyIZLNgvjDs"
      }, function(ret, err) {
          if (ret.status) {
            var md5_pass = ret.value;

            _common.req({
              url: "openapi/order/order/pay",
              method: "POST",
              loading: true,
              data: {
                orderNos: orderno,
                payPassword: md5_pass,
              },
              success: function(data){
                window.closeCMask();
                callback && callback(data);
              },
              complete: function(){
                canPayOrder = true;
              }
            });

          } else {
            canPayOrder = true;
            alert("加密出错："+JSON.stringify(err));
          }
      });

    }

  }


  //*========================= 公用配置 ====================== *//
  _common.set = {
    //加载框配置
    UILoadingConfig:{
      center: {
          x: api.winWidth/2.0,
          y: api.winHeight/2.0
      },
      mask: "rgba(0,0,0,0.7)",
      size: 35,
    }
  }



  return _common;

});
