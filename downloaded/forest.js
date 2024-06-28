var screen_width = device.width;
var screen_height = device.height;
var find_energy_points = '970,1580'; // 找能量的坐标轴位置，以逗号分隔
var onekey_collect_points = '550,1400'; // 一键收的坐标轴位置，以逗号分隔
var nine_palace_grid_password = [
  '535,1480',
  '800,1480',
  '800,1745',
  '800,2010',
  '535,2010',
]; // 九宫格密码滑动的坐标轴位置

unlock();
sleep(2000);

mainEntrence();

// 程序主入口
function mainEntrence() {
  // 打开支付宝
  openAlipay();
  sleep(5000);
  // 收集能量
  collectEnergy();
  sleep(2000);
  // 通过找能量收取好友能量
  findFriendEnergy();
  //结束后返回主页面
  whenComplete();

  exit();
}

//解锁
function unlock() {
  if (!device.isScreenOn()) {
    console.log('点亮屏幕 -> 解锁');
    // 点亮屏幕
    device.wakeUp();
    sleep(1000);
    swipe(500, 1900, 500, 0, 500);
    sleep(500);
    const pos = nine_palace_grid_password.map(it => {
      return it.split(',').map(i => +i);
    });
    gesture.apply(null, [800].concat(pos));
  }
}

// 收集能量
function collectEnergy() {
  toastLog("能量收集开始");
  for (var row = screen_height * 0.256; row < screen_height * 0.376; row += 80)
    for (var col = screen_width * 0.185; col < screen_width * 0.765; col += 80) {
      click(col, row);
    }
  toastLog("能量收集完成");
  sleep(100);
}

// 找到好友的能量
function findFriendEnergy() {
  let flag = true;
  let count = 1;
  toastLog("好友能量收集开始");
  while (flag) {
    clickByPoints(find_energy_points);
    if (text('返回我的森林').exists()) {
      console.log('检测到返回我的森林，好友能量收取完毕');
      clickByText('返回我的森林');
      flag = false;
      return;
    }
    sleep(1000);
    console.log('好友能量收集第' + count + '次');
    if (onekey_collect_points) {
      clickByPoints(onekey_collect_points);
    } else {
      collectEnergy();
    }
  }
}

function clickByText(t) {
  const item = text(t).findOne();
  if (item) {
    var posb = item.bounds();
    click(posb.centerX(), posb.centerY());
    sleep(100);
  }
}

function clickByPoints(points) {
  var pointArr = points.split(',');
  click(+pointArr[0], +pointArr[1]);
  sleep(2000);
}

//结束后返回主页面
function whenComplete() {
  toastLog("结束");
  back();
  sleep(1500);
  back();
}

// 打开支付宝进入我的能量页
function openAlipay() {
  console.log('启动支付宝直接打开到我的能量页');
  app.startActivity({
    action: 'VIEW',
    data: 'alipays://platformapi/startapp?appId=60000002',
    packageName: 'com.eg.android.AlipayGphone',
  });
}
