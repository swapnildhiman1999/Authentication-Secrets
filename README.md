Lite Version of Whisper App where user can signup with google or through normal sign-up and tell the secret anonymously.
Level 1: Register Users with Username and Password
Level 2(a): Database encryption ( we are using mongoose-encryption which uses secret as a key to encrypt and decrypt the password field, mongoose-encryption automatically encrypts the password field on calling save() and decrypts when we call find () function.
Level 2(b): Using  Environment Variables to keep Secrets safe
Level 3: Hashing the password(Using md5 as hash function.)
Level 4: Avoiding dictionary attacks by using Salting(Using bcrypt(17k per second) instead of md5(20 billion per second))
Level 5: Session and cookies:Using passport.js to implement cookie for login session
Level 6: OAuth 2.0 & Implementing Sign-In with google option to make user authenticated,
