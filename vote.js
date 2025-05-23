// Your game name
const gameName = 'crushgirls'; // <- CHANGE this for each game

// Firebase setup
const firebaseConfig = {
  // Your Firebase configuration here
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Load FingerprintJS
let fpPromise = FingerprintJS.load();

// Get user's IP address safely with error handling
async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) throw new Error('Failed to fetch IP');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    console.warn('IP fetch failed, defaulting to unknown-ip');
    return 'unknown-ip';
  }
}

// Load nominees and check if user has already voted
async function loadNominees() {
  const nomineeList = document.getElementById('nomineeList');
  nomineeList.innerHTML = '<li>Loading nominees...</li>';

  try {
    // Fetch IP and fingerprint simultaneously
    const [ip, fp] = await Promise.all([getUserIP(), fpPromise.then(fp => fp.get())]);
    const fingerprint = fp.visitorId;

    // Check if user has voted based on IP or fingerprint for this game
    const [voteQuery, fingerprintQuery] = await Promise.all([
      db.collection('votes').where('game', '==', gameName).where('ip', '==', ip).get(),
      db.collection('votes').where('game', '==', gameName).where('fingerprint', '==', fingerprint).get()
    ]);

    const hasVoted = !voteQuery.empty || !fingerprintQuery.empty;

    // Get nominees for this game
    const querySnapshot = await db.collection('nominations').where('game', '==', gameName).get();

    nomineeList.innerHTML = '';

    if (querySnapshot.empty) {
      nomineeList.innerHTML = '<li>No nominees found.</li>';
      return;
    }

    // For each nominee, create list item and vote button
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement('li');
      li.textContent = `${data.username} (${data.year} - ${data.branch}) `;

      const voteBtn = document.createElement('button');
      voteBtn.textContent = hasVoted ? 'Already Voted' : 'Vote';
      voteBtn.classList.add('vote-btn');
      voteBtn.disabled = hasVoted;

      if (!hasVoted) {
        voteBtn.onclick = () => voteForNominee(doc.id, ip, fingerprint, voteBtn);
      }

      li.appendChild(voteBtn);
      nomineeList.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading nominees:", error);
    nomineeList.innerHTML = '<li>Error loading nominees. Please try again later.</li>';
  }
}

// Vote for a nominee
async function voteForNominee(nomineeId, ip, fingerprint, voteBtn) {
  voteBtn.disabled = true;
  voteBtn.textContent = 'Submitting...';

  const nomineeRef = db.collection('nominations').doc(nomineeId);
  const voteRef = db.collection('votes').doc(); // auto-generated id

  try {
    await db.runTransaction(async (transaction) => {
      const nomineeDoc = await transaction.get(nomineeRef);
      if (!nomineeDoc.exists) {
        throw new Error("Nominee does not exist!");
      }
      const newVotes = (nomineeDoc.data().votes || 0) + 1;
      transaction.update(nomineeRef, { votes: newVotes });

      transaction.set(voteRef, {
        game: gameName,
        nomineeId,
        ip,
        fingerprint,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    alert('Thank you for voting!');
    disableVoteButtons();
  } catch (error) {
    console.error("Voting failed: ", error);
    alert("Error while voting. Please try again.");
    voteBtn.disabled = false;
    voteBtn.textContent = 'Vote';
  }
}

// Disable all vote buttons after vote
function disableVoteButtons() {
  document.querySelectorAll('button.vote-btn').forEach(btn => {
    btn.disabled = true;
    btn.textContent = 'Already Voted';
    btn.style.backgroundColor = '#555';
    btn.style.cursor = 'not-allowed';
  });
}

// Run loadNominees on page load
window.onload = loadNominees;
