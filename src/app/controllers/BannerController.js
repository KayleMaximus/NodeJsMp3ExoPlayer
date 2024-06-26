const { db, storage } = require("../../config/db/firebase");
const { v4: uuidv4 } = require("uuid");
const Banner = require("../models/Banner");
const generateRandomID = require("../utils/randomID");
const sendNotification = require("../utils/notification");
const redisClient = require("../../config/redis");

const cacheKey = "all-banners";

class BannerController {
  async index(req, res, next) {
    const list = [];
    await db
      .collection("banners")
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          const bannerData = doc.data();
          const banner = new Banner(
            bannerData.bannerID,
            bannerData.title,
            bannerData.body,
            bannerData.link,
            bannerData.imageURL
          );
          list.push(banner);
        });
      });

    try {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(list));
    } catch (error) {
      console.log(error);
    }

    res.send(list);
  }
  async create(req, res) {
    const bannerID = generateRandomID(23);
    const { title, body, link } = req.body;
    const file = req.file;

    try {
      console.log(bannerID, file, link);

      const fileName = uuidv4(); // Generate a unique filename using UUID
      const destinationFileName = "images/" + fileName; // Use the generated filename

      await storage.bucket().file(destinationFileName).save(file.buffer, {
        contentType: file.mimetype,
      });

      const fileURL = await storage
        .bucket()
        .file(destinationFileName)
        .getSignedUrl({
          action: "read",
          expires: "01-01-3000",
        });

      const newBanner = new Banner(
        bannerID,
        title,
        body,
        link,
        fileURL.toString()
      );

      console.log(newBanner);
      try {
        await db.collection("banners").add({
          bannerID: newBanner.bannerID,
          title: newBanner.title,
          body: newBanner.body,
          link: newBanner.link,
          imageURL: newBanner.imageURL,
        });

        redisClient.del(cacheKey, (err, response) => {
          if (err) throw err;
          console.log(`Cache key ${cacheKey} deleted`);
        });
      } catch (error) {
        console.log(error);
      }

      sendNotification("marketing", newBanner);

      res.status(201).send("Banner created successfully");
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }

  async update(req, res) {
    const bannerID = req.params.bannerID;
    const { link } = req.body;

    // Tạo một object JSON chứa các trường cần cập nhật
    const updatedData = {};

    if (link) updatedData.link = link;

    try {
      // Tìm tài liệu có trường id phù hợp
      const bannerRef = db
        .collection("banners")
        .where("bannerID", "==", bannerID);
      const myBanner = await bannerRef.get();

      if (myBanner.empty) {
        res.status(404).send("Banner not found");
        return;
      }

      // Cập nhật chỉ các trường đã được cung cấp trong updatedData
      const doc = myBanner.docs[0];

      try {
        await doc.ref.update(updatedData);
        redisClient.del(cacheKey, (err, response) => {
          if (err) throw err;
          console.log(`Cache key ${cacheKey} deleted`);
        });
      } catch (error) {
        console.log(error);
      }

      res.status(200).send("Banner updated successfully");
    } catch (error) {
      console.error("Error updating user: ", error);
      res.status(500).send("Internal Server Error");
    }
  }

  async delete(req, res) {
    try {
      const bannerID = req.params.bannerID;

      const bannerRef = db
        .collection("banners")
        .where("bannerID", "==", bannerID);
      const myBanner = await bannerRef.get();

      if (myBanner.empty) {
        res.status(404).send("Banner not found");
        return;
      }

      const doc = myBanner.docs[0];
      try {
        await doc.ref.delete();
        redisClient.del(cacheKey, (err, response) => {
          if (err) throw err;
          console.log(`Cache key ${cacheKey} deleted`);
        });
      } catch (error) {
        console.log(error);
      }

      res.status(200).send("Banner deleted successfully");
    } catch (error) {
      console.error("Error updating user: ", error);
      res.status(500).send("Internal Server Error");
    }
  }

  async getBannerByBannerID(req, res, next) {
    const bannerID = req.query.bannerID;
    let banner;
    await db
      .collection("banners")
      .where("bannerID", "==", bannerID)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          const bannerData = doc.data();
          banner = new Banner(
            bannerData.bannerID,
            bannerData.title,
            bannerData.body,
            bannerData.link,
            bannerData.imageURL
          );
        });
      })
      .catch(next);
    res.send(banner);
  }
}

module.exports = new BannerController();
