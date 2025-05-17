const firebaseConfig = {
  apiKey: "AIzaSyCK3nlpXHOUrTLfVKbO9o292dzn0gvzWBI",
  authDomain: "confession-vote.firebaseapp.com",
  projectId: "confession-vote",
  storageBucket: "confession-vote.appspot.com",
  messagingSenderId: "668697658094",
  appId: "1:668697658094:web:051ae4fcd66529bab669ff"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
