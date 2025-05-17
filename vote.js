function loadNominees() {
  const nomineeList = document.getElementById('nomineeList');
  nomineeList.innerHTML = '<li>Loading nominees...</li>';

  db.collection('nominations').get()
    .then((querySnapshot) => {
      nomineeList.innerHTML = '';

      if (querySnapshot.empty) {
        nomineeList.innerHTML = '<li>No nominees found.</li>';
        return;
      }

      const hasVoted = localStorage.getItem('hasVoted');

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement('li');

        li.textContent = `${data.username} (${data.year} - ${data.branch})`;

        const voteBtn = document.createElement('button');
        voteBtn.textContent = 'Vote';
        voteBtn.classList.add('vote-btn');

        if (hasVoted) {
          voteBtn.disabled = true;
          voteBtn.textContent = 'Already Voted';
          voteBtn.style.backgroundColor = '#555';
          voteBtn.style.cursor = 'not-allowed';
        } else {
          voteBtn.onclick = () => voteForNominee(doc.id);
        }

        li.appendChild(voteBtn);
        nomineeList.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error loading nominees:", error);
      nomineeList.innerHTML = '<li>Error loading nominees. See console.</li>';
    });
}

function voteForNominee(nomineeId) {
  const nomineeRef = db.collection('nominations').doc(nomineeId);

  db.runTransaction((transaction) => {
    return transaction.get(nomineeRef).then((doc) => {
      if (!doc.exists) {
        throw "Nominee does not exist!";
      }
      let newVotes = (doc.data().votes || 0) + 1;
      transaction.update(nomineeRef, { votes: newVotes });
      return newVotes;
    });
  })
  .then((newVotes) => {
    alert(`Thank you for voting! This nominee now has ${newVotes} votes.`);

    // Mark as voted in localStorage
    localStorage.setItem('hasVoted', 'true');

    // Disable all vote buttons now
    disableVoteButtons();
  })
  .catch((error) => {
    console.error("Voting failed: ", error);
    alert("Error while voting. Please try again.");
  });
}

function disableVoteButtons() {
  const buttons = document.querySelectorAll('button.vote-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.textContent = 'Already Voted';
    btn.style.backgroundColor = '#555';
    btn.style.cursor = 'not-allowed';
  });
}

window.onload = loadNominees;
