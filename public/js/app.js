// ConfiguraciÃ³n de Firebase
var firebaseConfig = {
    apiKey: "AIzaSyCiCDKNiIcTHWQ6tCFjIrsD7WDuSM71F94",
    authDomain: "recuperadocv2.firebaseapp.com",
    projectId: "recuperadocv2",
    storageBucket: "recuperadocv2.firebasestorage.app",
    messagingSenderId: "483985436195",
    appId: "1:483985436195:web:24b5568e9360ed935f8b96"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();



// Referencias a los formularios
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');



// registro de usuario
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = registerForm['nombre'].value;
        const barrio = registerForm['barrio'].value;
        const email = registerForm['email'].value;
        const password = registerForm['password'].value;
        const cedula = registerForm['cedula'].value;
        const telefono = registerForm['telefono'].value;

        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                return user.updateProfile({
                    displayName: nombre // Set the displayName to nombre
                }).then(() => {
                    return db.collection('users').doc(user.uid).set({
                        nombre: nombre,
                        barrio: barrio,
                        email: email,
                        cedula: cedula,
                        telefono: telefono
                    });
                });
            })
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Error: ', error.message);
            });
    });
}

// FunciÃ³n de login
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm['email'].value;
        const password = loginForm['password'].value;
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
           
                window.location.href = '/public/index.html';

            })
            .catch((error) => {
                console.error('Error: ', error.message);
            });
    });
}

// Inicializar la autenticaciÃ³n de Firebase y obtener una referencia al servicio
function inicializarFormularioReporte(user, userData) {
    // LÃ³gica para inicializar el formulario con los datos del usuario
}


firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // El usuario ha iniciado sesiÃ³n, obtener datos adicionales del usuario
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                inicializarFormularioReporte(user, userData);
            } else {
                console.error('Â¡No existe tal documento!');
            }
        }).catch((error) => {
            console.error('Error al obtener el documento:', error);
        });
    } else {
        // No hay usuario iniciado sesion, redirigir a la pÃ¡gina de inicio de sesion o manejarlo adecuadamente
        console.error('sin usuario');
    }
});


// Funcion para reportar documento
const reportForm = document.getElementById('report-form');
if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const documentname = reportForm['document-name'].value;
      const documenttype = reportForm['document-type'].value;
      const documentnumber = reportForm['document-number'].value;
      const documentfoundlocation = reportForm['found-location'].value;
      const documentdescription = reportForm['description'].value;
      const file = reportForm['document-photo'].files[0];
      const documentstorageRef = storage.ref('documents/' + file.name);
  
      documentstorageRef.put(file).then(() => {
        documentstorageRef.getDownloadURL().then((url) => {
          const user = firebase.auth().currentUser; // Get the current user
          // Retrieve the user's phone number from Firestore
          db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
              const userData = doc.data();
              db.collection('documents').add({
                documentName: documentname,
                documentType: documenttype,
                documentNumber: documentnumber,
                documentLocation: documentfoundlocation,
                documentDescription: documentdescription,
                photoURL: url,
                userId: user.uid,
                reporterName: user.displayName, 
                reporterEmail: user.email,
                reporterPhone: userData.telefono,
                cedulaReportador: userData.cedula,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
              }).then(() => {
                alert('Documento reportado exitosamente');
                reportForm.reset();
              }).catch((error) => {
                console.error('Error al reportar documento: ', error);
              });
            } else {
              console.error('No se encontrÃ³ el documento del usuario');
            }
          }).catch((error) => {
            console.error('Error al obtener el documento del usuario: ', error);
          });
        });
      });
    });
  }



// FunciÃ³n para buscar documento x name
const searchFormname = document.getElementById('search-form-name');
if (searchFormname) {
    searchFormname.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchFormname['search-query'].value;
        db.collection('documents').where('documentName', '==', query).get()
            .then((querySnapshot) => {
                const resultsDiv = document.getElementById('search-results');
                resultsDiv.innerHTML = '';
                querySnapshot.forEach((doc) => {
                    const document = doc.data();
                    resultsDiv.innerHTML += `
            <div class="card mb-3">
              <div class="row no-gutters">
                <div class="col-md-4">
                  <img src="${document.photoURL}" class="card-img" alt="${document.documentName}" style="width: 100%; height: auto;">
                </div>
                <div class="col-md-8">
                  <div class="card-body">
                 <h5 class="card-title">${document.documentName}</h5>
                <p class="card-text">${document.documentDescription}</p>
                <p class="card-text"><small class="text-muted">Tipo de documento: ${document.documentType}</small></p>
                <p class="card-text"><small class="text-muted">Numero de documento: ${document.documentNumber}</small></p>
                <p class="card-text"><small class="text-muted">Ubicacion encontrada: ${document.documentLocation}</small></p>
                <p class="card-text"><small class="text-muted">Reportado por: ${document.reporterName}</small></p>
                <p class="card-text"><small class="text-muted">Cedula Del reportador: ${document.cedulaReportador}</small></p>
                <p class="card-text"><small class="text-muted">Contacto: ${document.reporterPhone}</small></p>
                <p class="card-text"><small class="text-muted">Fecha de reporte: ${document.timestamp.toDate()}</small></p>
                    <button class="btn btn-success" onclick="requestRescue('${doc.id}', '${document.documentName}', '${document.description}', '${document.userEmail}')">Solicitar Rescate</button>
                  </div>
                </div>
              </div>
            </div>
          `;
                });
            }).catch((error) => {
                console.error('Error al buscar documento: ', error);
            });
    });
}


// FunciÃ³n para buscar documento x id
const searchFormid = document.getElementById('search-form-id');
if (searchFormid) {
    searchFormid.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchFormid['search-query'].value;
        db.collection('documents').where('documentNumber', '==', query).get()
            .then((querySnapshot) => {
                const resultsDiv = document.getElementById('search-results');
                resultsDiv.innerHTML = '';
                querySnapshot.forEach((doc) => {
                    const document = doc.data();
                    resultsDiv.innerHTML += `
            <div class="card mb-3">
              <div class="row no-gutters">
                <div class="col-md-4">
                  <img src="${document.photoURL}" class="card-img" alt="${document.documentName}" style="width: 100%; height: auto;">
                </div>
                <div class="col-md-8">
                  <div class="card-body">
           <h5 class="card-title">${document.documentName}</h5>
                <p class="card-text">${document.documentDescription}</p>
                <p class="card-text"><small class="text-muted">Tipo de documento: ${document.documentType}</small></p>
                <p class="card-text"><small class="text-muted">Numero de documento: ${document.documentNumber}</small></p>
                <p class="card-text"><small class="text-muted">Ubicacion encontrada: ${document.documentLocation}</small></p>
                <p class="card-text"><small class="text-muted">Reportado por: ${document.reporterName}</small></p>
                <p class="card-text"><small class="text-muted">Cedula Del reportador: ${document.cedulaReportador}</small></p>
                <p class="card-text"><small class="text-muted">Contacto: ${document.reporterPhone}</small></p>
                <p class="card-text"><small class="text-muted">Fecha de reporte: ${document.timestamp.toDate()}</small></p>
                    <button class="btn btn-success" onclick="requestRescue('${doc.id}', '${document.documentName}', '${document.description}', '${document.userEmail}')">Solicitar Rescate</button>
                  </div>
                </div>
              </div>
            </div>
          `;
                });
            }).catch((error) => {
                console.error('Error al buscar documento: ', error);
            });
    });
}

// public key rpHKuT-7sXiJTX2Vl
// Template id template_gigh94u
// Srvice ID service_h8lj45x


/// Función para solicitar rescate de documento
function requestRescue(documentId, reporterEmail) {
    const user = firebase.auth().currentUser;
    if (user) {
      db.collection('documents').doc(documentId).get().then((doc) => {
        if (doc.exists) {
          const dataDoc = doc.data();
          db.collection('users').doc(user.uid).get().then((userDoc) => {
            if (userDoc.exists) {
              const dataUser = userDoc.data();
  
              db.collection('rescueRequests').add({
                userName: dataUser.nombre,
                userEmail: dataUser.email,
                userPhone: dataUser.telefono,
                userBarrio: dataUser.barrio,
                userCedula: dataUser.cedula,
                documentName: dataDoc.documentName,
                documentType: dataDoc.documentType,
                documentNumber: dataDoc.documentNumber,
                documentLocation: dataDoc.documentLocation,
                documentDescription: dataDoc.documentDescription,
                photoURL: dataDoc.photoURL,
                userId: user.uid,
                reporterName: dataDoc.reporterName,
                reporterEmail: dataDoc.reporterEmail,
                reporterPhone: dataDoc.reporterPhone,
                cedulaReportador: dataDoc.cedulaReportador,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
              }).then(() => {
                // Enviar correo electrónico usando EmailJS
  
                // Parámetros para el correo al reportero
                const reporterParams = {
                  to_email: dataDoc.reporterEmail,

                  user_Name: dataUser.nombre,
                  user_Email: dataUser.email,
                  user_Phone: dataUser.telefono,
                  user_Barrio: dataUser.barrio,
                  user_Cedula: dataUser.cedula,
                  user_Id: user.uid,

                  document_Name: dataDoc.documentName,
                  document_Type: dataDoc.documentType,
                  document_Number: dataDoc.documentNumber,
                  document_Location: dataDoc.documentLocation,
                  document_Description: dataDoc.documentDescription,                  
      
                  reporter_Name: dataDoc.reporterName,
                  reporter_Email: dataDoc.reporterEmail,
                  reporter_Phone: dataDoc.reporterPhone,
                  cedula_Reportador: dataDoc.cedulaReportador,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
  
                // Enviar correo al reportero
                emailjs.send('service_h8lj45x', 'template_gigh94u', reporterParams)
                  .then(() => {
                    console.log('Correo enviado al reportero');
                  }, (error) => {
                    console.error('Error al enviar el correo al reportero: ', error);
                  });
                    // Parámetros para el correo al user
                  const userParams = {
                    to_email: dataUser.email,
  
                    user_Name: dataUser.nombre,
                    user_Email: dataUser.email,
                    user_Phone: dataUser.telefono,
                    user_Barrio: dataUser.barrio,
                    user_Cedula: dataUser.cedula,
                    user_Id: user.uid,
  
                    document_Name: dataDoc.documentName,
                    document_Type: dataDoc.documentType,
                    document_Number: dataDoc.documentNumber,
                    document_Location: dataDoc.documentLocation,
                    document_Description: dataDoc.documentDescription,                  
        
                    reporter_Name: dataDoc.reporterName,
                    reporter_Email: dataDoc.reporterEmail,
                    reporter_Phone: dataDoc.reporterPhone,
                    cedula_Reportador: dataDoc.cedulaReportador,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                  };
    
                 // Parámetros para el correo al user
                  emailjs.send('service_h8lj45x', 'template_3cb5pqh', userParams)
                    .then(() => {
                      console.log('Correo enviado al user');
                    }, (error) => {
                      console.error('Error al enviar el correo al reportero: ', error);
                    });
  
                // Parámetros para el correo al solicitante del rescate
                // const rescueParams = {
                //   to_email: user.email, // Correo del solicitante
                //   user_name: user.displayName,
                //   user_email: user.email,
                //   user_phone: user.phoneNumber,
                //   user_cedula: dataUser.cedula, // Agregar cédula
                //   user_telefono: dataUser.telefono, // Agregar teléfono
                //   user_nombre: dataUser.nombre, // Agregar nombre
                //   user_barrio: dataUser.barrio, // Agregar barrio
                //   document_name: dataDoc.documentName,
                //   description: dataDoc.description,
                //   documentType: dataDoc.documentType,
                //   documentNumber: dataDoc.documentNumber,
                //   foundLocation: dataDoc.foundLocation
                // };
  
                // Enviar correo al solicitante del rescate
                // emailjs.send('service_h8lj45x', 'template_gigh94u', reporterParams)
                //   .then(() => {
                //     console.log('Correo enviado al solicitante');
                //   }, (error) => {
                //     console.error('Error al enviar el correo al solicitante: ', error);
                //   });
  
              }).catch((error) => {
                console.error('Error al solicitar rescate: ', error);
              });
            } else {
              console.error('¡No existe tal documento!');
            }
          }).catch((error) => {
            console.error('Error al obtener el documento del usuario:', error);
          });
        } else {
          console.error('¡No existe tal documento!');
        }
      }).catch((error) => {
        console.error('Error al obtener el documento:', error);
      });
    } else {
      alert('Debes iniciar sesión para solicitar un rescate');
      window.location.href = 'login.html';
    }
  }


