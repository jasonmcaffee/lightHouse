let lightController = require('./service/lightController');

console.log(`testing light controller`);
//lightController.findAndConnectToBridge();
// lightController.createUser({
// 	ipaddress: "192.168.1.118"
// });
lightController.dimAllLights();