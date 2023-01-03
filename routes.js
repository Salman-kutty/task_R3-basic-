const router = require('express').Router();
const empCtrl = require('./controller/empCtrl')
router.post('/post', empCtrl.postData);
router.get('/find', empCtrl.allDataFromDB);
router.put('/update', empCtrl.updateData);
router.delete('/delete', empCtrl.deleteData);

module.exports = router;