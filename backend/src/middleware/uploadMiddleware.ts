import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const filetypes = /mp4|mov|avi|mkv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Images only!")); // Wait, video only.
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /mp4|mov|avi|mkv/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = file.mimetype.startsWith("video/");

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Videos only!"));
    }
  },
});

export default upload;
