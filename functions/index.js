const functions = require('firebase-functions');
const firebase1 = require("firebase");
var admin = require('firebase-admin'); // for accessing the realtime database

var firebaseConfig = require('./firebase.config.json');
admin.initializeApp(functions.config().firebase); // initialize the Firebase Admin SDK
firebase1.initializeApp(firebaseConfig);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
	response.send("Hello from Firebase!");
});

exports.SampleNotification = functions.https.onRequest((request, response) => {

	if (request.method == 'POST') {

		var notification_data = {};
		notification_data = {
			payload: {
				title: 'BikePooling',
				body: 'Your rider is available'
			},
			data: {
				score: '850',
				time: '2:45'
			},
			device_token: request.body.device_token.toString()
		};
		has_notification = true;

		var payload = {
			notification: notification_data.payload
		};
		let options = message.MessagingOptions
		// send push notification
		admin.messaging().sendToDevice(notification_data.device_token, payload).then(function (res) {

			response.send(JSON.stringify({ 'has_notification': true })); // inform the app that a notification was sent
		})
			.catch(function (error) {
				response.send(JSON.stringify(error)); // send the push notification error to the app
			});
	}
});

exports.ResetPassword = functions.https.onRequest((request, response) => {

	if (request.method == 'POST') {
		var emailAddress = request.body.emailAddress;

		firebase1.auth().sendPasswordResetEmail(emailAddress).then(function () {
			response.send({ success: true, message: "Reset Password Sent Successfully !" })
		}).catch(function (error) {
			// An error happened.
			response.send({ success: false, message: error })
		});
	}
})

exports.RideUsers = functions.https.onRequest((request, response) => {

	if (request.method == 'POST') {
		var userlists = [];
		var ref = admin.database().ref("users");
		ref.on("value", function (snapshot) {
			snapshot.forEach(function (childSnapshot) {
				var childData = childSnapshot.val();
				userlists.push(childData);
			})
		})
		response.send({ success: true, Data: userlists });
	}
})

exports.DeleteLogOutUser = functions.https.onRequest((request, response) => {
	if (request.method == 'POST') {
		var userid = request.body.userid;

		var ref = admin.database().ref("users");

		ref.on("value", function (snapshot) {
			snapshot.forEach(function (childSnapshot) {
				var childData = childSnapshot.val();
				if (childData.userid == userid) {
					//childSnapshot.ref.remove();
				}
			})
		})

		response.send({ success: true, message: "Records Deleted Successfully !" });
	}
})

exports.GetMyRide = functions.https.onRequest((request, response) => {
	if (request.method == 'POST') {
		try {
			var userid = request.body.userid;
			var rideLists = [];
			var ref = admin.database().ref("rides");

			ref.on("value", function (snapshot) {
				snapshot.forEach(function (childSnapshot) {
					var childData = childSnapshot.val();
					if (childData.rideruserid == userid) {
						rideLists.push(childData);
					}
				})
			})
			response.send({ message: "User Updated Success" + userid, success: true, rides: rideLists });
		}
		catch (e) {
			response.send({ message: JSON.stringify(e), success: false });
		}
	}
})

exports.AddMyRide = functions.https.onRequest((request, response) => {
	if (request.method == 'POST') {

		var userId = request.body.UserId;
		var userName = request.body.UserName;
		var email = request.body.Email;

		admin.database().ref('/rides').push({
			userid: userId,
			username: userName,
			email: email
		});
		response.send(JSON.stringify({ success: true }));
	}
})

exports.CheckUserExists = functions.https.onRequest((request, response) => {
	var userid = request.body.userid;
	if (request.method == 'POST') {
		try {
			admin.database().ref('/users').orderByChild("userid").equalTo(userid).once("value",snapshot => {
				if (snapshot.exists()){
				  const userData = snapshot.val();				  
				  response.send({ message: "error Update", success: userData })
				}
				else{
					response.send({ message: "error Update", success: null })
				}
			});
		}
		catch (e) {
			response.send({ message: "error Update", success: userid })
		}
	}
})

exports.CreateWithSocialLogin = functions.https.onRequest((request, response) => {

	if (request.method == 'POST') {
		try {
			var userid = request.body.userid;
			var deviceToken = request.body.deviceToken;
			var username = request.body.username;
			var email = request.body.email;
			var profilePhoto = request.body.profilePhoto;

			admin.database().ref('/users').orderByChild("userid").equalTo(userid).once("value",snapshot => {
				if (snapshot.exists()){				  			  
				  response.send({ message: "Record Already Exists", success: userData })
				}
				else{
					admin.database().ref('/users').push({
						userid: userid,
						username: username,
						email: email,
						deviceToken: deviceToken,
						profilePhoto: profilePhoto,
						latitude: '',
						longitude: '',
						status: "Online"
					});
					response.send({ message: "Records Inserted Successfully !", success: null })
				}
			});
			
			response.send({message:"Records Inserted Succesfully !",success:true})
		}
		catch (e) {
			response.send({ message: e, success: false });
		}
	}
})

exports.SignIn = functions.https.onRequest((request, response) => {
	var email = request.body.email;
	var password = request.body.password;

	if (request.method == 'POST') {
		try {
			firebase1.auth().signInWithEmailAndPassword(email, password).then((user) => {

				let objUser = {
					email: user.email,
					username: user.displayName,
					userid: user.uid,
					photoImageURL: user.photoURL,
					latitude: '',
					longitude: '',
					status: "Online"
				}

				response.send({ message: "SignSuccess", data: user, success: true })
			})
		}
		catch (e) {
			response.send({ message: "SignFailed", data: email, success: false })
		}
	}
})


exports.SignInWithUserPwd = functions.https.onRequest((request, response) => {

	var username = request.body.username;
	var email = request.body.email;
	var password = request.body.password;
	var deviceToken = request.body.deviceToken;		

	if (request.method == 'POST') {
		firebase1.auth().createUserWithEmailAndPassword(email, password).then((user) => {
			try {
				var userId = user.user.uid;
				
				admin.database().ref('/users').push({
					userid: userId,
					username: username,
					email: email,
					deviceToken: deviceToken,
					latitude: '',
					longitude: '',
					status: 'Online'
				});

				var userInfo = firebase1.auth().currentUser;

				userInfo.sendEmailVerification().then(function () {
					response.send({ message: "sendEmailVerification send succesfully", success: true })
				}).catch(function (error) {
					// An error happened.
					response.send({ message: error, success: false })
				});

				response.send(JSON.stringify({ success: true }));
			}
			catch (e) {
				response.send("error Inside:" + e);
			}

		}).catch((err) => {
			response.writeHead(500, { "Content-Type": "application/json" });
			response.send(JSON.stringify({ error: err }));
		});
	}
});

exports.RideStatus = functions.https.onRequest((request, response) => {
	if (request.method == 'POST') {
		var deviceToken = request.body.deviceToken[0].deviceToken;
		var status = request.body.requestStatus;
		var usercurrentLocation = request.body.currentLocation;
		var userdestinationLocation = request.body.destinationLocation;
		var phoneNo = request.body.phoneNo;

		var objRideInfo = {
			rideLocation: usercurrentLocation,
			destinationLocation: userdestinationLocation,
			device_token: deviceToken,
			ridestatus: status,
			phoneNo: phoneNo
		}

		var notification_data = {};
		notification_data = {
			payload: {
				title: 'On d Vay',
				body: 'Request Status for Ride'
			},
			device_token: deviceToken
		};
		has_notification = true;

		var payload = {
			notification: notification_data.payload,
			data: {
				value: JSON.stringify(objRideInfo)
			}
		}

		admin.messaging().sendToDevice(deviceToken, payload).then(function (res) {
			response.send(JSON.stringify({ 'has_notification': notification_data.device_token })); // inform the app that a notification was sent
		})
			.catch(function (error) {
				response.send(JSON.stringify(error)); // send the push notification error to the app
			});
	}
})

exports.RideUpdateUserLocation = functions.https.onRequest((request, response) => {

	if (request.method == 'POST') {
		var userid = request.body.userid;
		var long = request.body.longitude;
		var lat = request.body.latitude;
		var status = request.body.status;

		var ref = admin.database().ref("users");

		ref.on("value", function (snapshot) {
			snapshot.forEach(function (childSnapshot) {
				var childData = childSnapshot.val();
				if (childData.userid == userid) {
					childSnapshot.ref.update({ longitude: long, latitude: lat, status: status });
				}
			})
		})
		response.send({ message: "User Updated Success", result: true, Data: userid });
	}
});

exports.RequestForRide = functions.https.onRequest((request, response) => {

	if (request.method == 'POST') {
		try {
			var riderId = request.body.userid;
			var rideStartTime = request.body.rideStartTime;
			var rideDistance = request.body.rideDistance;
			var usercurrentLocation = request.body.currentLocation;
			var userdestinationLocation = request.body.destinationLocation;
			var userrequestDeviceToken = request.body.deviceToken;

			var ref = admin.database().ref("users");

			ref.on("value", function (snapshot) {
				snapshot.forEach(function (childSnapshot) {
					var childData = childSnapshot.val();
					if (childData.userid.toString() == riderId) {

						var objRideInfo = {
							rideDistance: rideDistance,
							rideStartTime: rideStartTime,
							rideLocation: usercurrentLocation,
							destinationLocation: userdestinationLocation,
							device_token: userrequestDeviceToken,
							ridestatus: -1
						}
						var notification_data = {};
						notification_data = {
							payload: {
								title: 'On d Vay',
								body: 'Request for Ride'
							},
							device_token: childData.deviceToken
						};
						has_notification = true;

						var payload = {
							notification: notification_data.payload,
							data: {
								value: JSON.stringify(objRideInfo)
							}
						};

						admin.database().ref('/rides').push({
							rideruserid: childData.userid,
							rideFromLocation: usercurrentLocation,
							rideToLocation: userdestinationLocation,
							rideDistance: rideDistance,
							rideStartTime: rideStartTime
						});

						// send push notification
						admin.messaging().sendToDevice(notification_data.device_token, payload).then(function (res) {
							response.send(JSON.stringify({ 'has_notification': true })); // inform the app that a notification was sent
						})
							.catch(function (error) {
								response.send(JSON.stringify(error)); // send the push notification error to the app
							});

					}
				});
			});
		}
		catch (e) {
			response.send("error : " + e); // send the push notification error to the app
		}
	}

});

exports.init_push = functions.https.onRequest((request, response) => {
	if (request.method == 'POST') {

		var id = request.body.id;
		var ref = admin.database().ref("users");

		ref.on("value", function (snapshot) {

			snapshot.forEach(function (childSnapshot) {
				var childData = childSnapshot.val();
				if (childData.userid == id) {
					try {

						response.send(JSON.stringify({ 'has_notification': childData })); // inform the app that a notification was sent
					}
					catch (e) {
						response.send(JSON.stringify(error)); // send the push notification error to the app
					}
				}

			})
		});
	}
});