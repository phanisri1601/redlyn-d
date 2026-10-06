# Your current Redlyn project

Use this `redlyn-d` folder. The duplicate original folder was archived in
`../LOCAL-BACKUP-DO-NOT-UPLOAD`; never upload that backup.

The app now supports your Firebase Firestore project `redlyn-cbbd3`.
Follow [Firebase setup](docs/FIREBASE-SETUP.md) for local testing and Vercel settings.
Uploads are disabled for this free text-feedback setup.

For GitHub, copy the updated source into your existing repository checkout,
keeping its `.git` directory. Do not copy `.env`, service-account JSON, `.data`,
`node_modules`, or backup archives into a new repository. The supplied `.gitignore`
protects local credentials, but inspect the files staged for commit before pushing.

The live site only changes after the new source is pushed and Vercel receives
its Production environment variables. Local SQLite/Site accounts and feedback
are not automatically migrated to Firebase.
