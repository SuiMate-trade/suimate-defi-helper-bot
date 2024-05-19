// Import the functions you need from the SDKs you need
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  credential: admin.credential.cert({
    projectId: 'suimate-defi-helper-bot',
    privateKey:
      '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDVex3UsQVsnnZU\n3HwITyYbmIAJ60knm8J8WutwpbK8gjWN2uo1+m91SNoU75gSUh3xpnHL0HML60/y\np0ZKqp3D5Ag1itzSOp2UpGeSFU1qxqYsMHAryZtq8GoIM81snf2Ba7bbjm9ZodiV\nDVmSGGczEPSw44Bja3C5NDl68aRQ756ZeFE25AmuGmq8fANSIB1bVpvbV8sawaBd\nI4yy146EQUJ9EK/VLlfJBG5PRbyJL23ZKjKKfk9BrAkSgqffCCBxzAbQEFLpcoY0\nrs7PI4x63LDAIHHN3pUpL+V864/GDrho3bG4TdqphCqmgBve/CbHZGPWuFEwaFpp\n8s0wZdOPAgMBAAECggEAARpSv2SBqIUjC6ZrHbtI0yRvZDCM09+GYhBew+FqjHY5\nRMcg0wa896orl+OQnsFBjN/EKOe1CHD+q3ie3cfwRR3xEnG80Yhig/S9WcLull0Q\nhoWAttfIZjKWCw1zkta/ocasaS8vzYs8O2ZM7pj0cLPUdPMBzYVxqAO+567z0/j2\n+bsLZwjl7A084EMQYuzPJbeUY2smshVsf5kfDoETs4r65AV4QkTHqTSMoP/7/4Dl\nXd5gOThl/NwOzNSqiVAn6zjDKo0UbXNNB0YUaRFF6FjVLZRym2gXHwc4o/4wqgaf\ncUflteHyo99vgkMayvwZ6AQa8h1TQ04xQsflSRsfxQKBgQD1jB8fw8TFdJ+aDCIj\n7lqGmBcLF4vYCLm/Kpt3oTjbuKKhYzK7mlGXhlYKxDWhbmMmpVoaRwNcBSVxaRdr\nZvRKs4PJwx9Eq1QHt1s9+Pmua4aHNYX1zyBLkqvkY1Y48Olc/cGyjvExjxrusDx8\n6sA/wH3OGaM7hmuwyeQ3g8Y6rQKBgQDekYwy9/+yWTS55Lnm9aB7p61wNRmLykMh\nblUPDuUFMQGZ6qWK7E4SC/I72k5PwUZWl55i5Mflw6ngiUky6/S/G1+hW9bwtTek\nEAD2SyN1gn1I9yBnPpmBHpuP08/0hqVCOiAeG4rsiSx558oP6HXaLDt1Nrpq4FRv\nxytVsJVqqwKBgCbTuFwyfZvnfBFE1+UsnH3p8MLdP0yy3IRA/YJmKPJ9eKHiaLRH\ni51VLafYLM7RALassNm03vAfFDOhtYVTK0/goPc3dmtKWCg8Mx5Sj1CoSgZ5TSx4\nSxgIIkwj9Q9d8Ni2e3l7puH6SfzyOy5ZhHrQOlRrs2cHM2IqGn84xBClAoGBAMIi\nGjPq9XFPNhpfU3gND6pMG5AgAORZzCxA3JiB2Wmp0Ue70CFY9M/w850ZUe1nHD8z\niMeh3mqfPHHJzbtI7PY0njlUrirPJnVIME6kQ42gAD/ArtbfV220kOPnUSBswYD+\nyjz4sTiYfd7nOuydSw6+Pi6DSh8nBP9qrnXTzMB5AoGAKCLo04s/lj/C7FXxNbjs\ncK/HAdORnVUQYWcLhWoBbAV5Im1s5LR/elIvzZAkS7W+1i3krryJkGFunr+GkRWe\nveiYvexLV/jZaDXf0oHbPJf5aBbJ1pabk4NrMOe4FQAnEn7IONllQ+LcgwHfnMKq\nfEKz5oSA7HX+DqXa/jyedYc=\n-----END PRIVATE KEY-----\n',
    clientEmail:
      'firebase-adminsdk-9m5iw@suimate-defi-helper-bot.iam.gserviceaccount.com',
  }),
};

// Initialize Firebase
const app = admin.initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

export default app;
