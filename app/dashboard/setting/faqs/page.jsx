"use client"

import { useState, useEffect } from 'react';
import { db, storage } from '../../../../app/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from '../../../../app/ui/dashboard/setting/faqs.module.css';
import Image from "next/image";

const FAQsPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      const docRef = doc(db, 'settings', 'faqs');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFaqs(docSnap.data().faqs);
      }
    };
    fetchFAQs();
  }, []);

  const handleImageChange = (e) => {
    setNewImage(e.target.files[0]);
  };

  const handleSave = async () => {
    let imageUrl = '';
    if (newImage) {
      const imageRef = ref(storage, `faqs/${newImage.name}`);
      await uploadBytes(imageRef, newImage);
      imageUrl = await getDownloadURL(imageRef);
    }

    const updatedFAQs = [...faqs, { question: newQuestion, answer: newAnswer, imageUrl }];
    const docRef = doc(db, 'settings', 'faqs');
    await updateDoc(docRef, {
      faqs: updatedFAQs,
    });

    setFaqs(updatedFAQs);
    setNewQuestion('');
    setNewAnswer('');
    setNewImage(null);
  };

  return (
    <div className={styles.container}>
      <h2>FAQs</h2>
      <div>
        <input
          type="text"
          placeholder="Question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        />
        <textarea
          placeholder="Answer"
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
        />
        <input type="file" onChange={handleImageChange} />
        <button onClick={handleSave}>Save FAQ</button>
      </div>

      <div>
        {faqs.map((faq, index) => (
          <div key={index}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
           {faq.imageUrl && (
          <Image
            src={faq.imageUrl}
            alt="FAQ image"
            width={100}
            height={100}
            style={{ marginTop: "10px", maxWidth: "100px", height: "auto" }}
          />
        )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQsPage;
