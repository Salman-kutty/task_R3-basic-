const router = require('express').Router();
const empCtrl = require('./controller/empCtrl')
const refreshRedis = () => { empCtrl.resettingRedis() };
refreshRedis();
router.post('/post', empCtrl.postData);
router.get('/find', empCtrl.allDataFromDB);
router.put('/update', empCtrl.updateData);
router.delete('/delete', empCtrl.deleteData);
router.get('/pagination', empCtrl.paginationData);
router.get('/filteration', empCtrl.filterData);

module.exports = router;