console.log('before imports')
import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import 'firebase/compat/database'
import 'firebase/compat/functions'
import 'firebase/compat/firestore'
console.log('after imports')

async function main() {
    console.log('initializing')
    firebase.initializeApp({
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.REACT_APP_FIREBASE_DATABSE_URL,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
        measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
    })
    console.log('initialized')
    firebase.auth().onAuthStateChanged(async (user) => {
        console.log('auth state changed', user)
        if (user) {
            const userFromDb = await firebase
                .firestore()
                .collection('user')
                .doc(user.uid)
                .get()
            console.log(userFromDb.data())
        }
    })
    console.log('fetching some user')
    const someUser = await firebase
        .firestore()
        .collection('user')
        .doc('0689KOtoiNNFQjxXgpYSCnK0hot2')
        .get()
    console.log(someUser.data())
}

main()
