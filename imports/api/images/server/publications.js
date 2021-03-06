import {Images}  from '../images.js';

Meteor.publish("allImagesByType", function(type){
  check(type,String);
  const options={sort:{uploadedAt:-1},limit:60};
  return Images.find({$or:[{owner:this.userId},{imageOf:type}]},options);
});

Meteor.publish("allImages", function(){
  const options={sort:{uploadedAt:-1},limit:60};
  if (Roles.userIsInRole(this.userId, 'admin')) {
    return Images.find({},options);
  }else {
    return Images.find({owner:this.userId},options);
  }

});

Meteor.publish("allImagesByTypeForAll", function(type, userIds){
  check(type, String);
  check(userIds, [String]);
  const options={sort:{uploadedAt:-1},limit:100};
  return Images.find({owner:{$in:userIds},imageOf:type},options);
});
