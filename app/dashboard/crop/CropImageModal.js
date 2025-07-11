import React, { useRef, useState, useEffect } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import styles from "./CropImageModal.module.css";

const CropImageModal = ({ imageFile, onCrop, onClose }) => {
  const cropperRef = useRef(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result);
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const handleCrop = () => {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper;
      const croppedCanvas = cropper.getCroppedCanvas();
      if (croppedCanvas) {
        croppedCanvas.toBlob((blob) => {
          onCrop(blob);
        }, "image/png"); 
      }
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Crop Your Avatar</h2>
        <div className={styles.cropContainer}>
          {image && (
            <Cropper
            ref={cropperRef}
            src={image}
            style={{ height: 300, width: "100%" }}
            viewMode={1}
            guides={true}
            minCropBoxHeight={100}
            minCropBoxWidth={100}
            background={false}
            autoCropArea={1}
            aspectRatio={NaN}
            />
          )}
        </div>
        <div className={styles.buttonContainer}>
          <button className={styles.cancelButton} onClick={onClose}>Close</button>
          <button className={styles.cropButton} onClick={handleCrop}>Crop</button>
        </div>
      </div>
    </div>
  );
};

export default CropImageModal;
