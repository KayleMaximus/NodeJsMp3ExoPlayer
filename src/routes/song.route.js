const express = require('express');
const router = express.Router();
const multer = require('multer');

const songController = require('../app/controllers/SongController');
const {getAllListenHistoryByUserID} = require('../app/middlewares/listenHistory');
const upload = multer();

router.get('/songSQL', songController.getSongFromSQLite);
router.get('/recent/:userID', getAllListenHistoryByUserID, songController.getRecentSongByUserID);
router.get('/nameAlbum', songController.getSongByAlbumName);
router.get('/nameArtist', songController.getSongByArtistName);
router.post('/', upload.single('songFile'), songController.create);
router.get('/', songController.index);

module.exports = router;
