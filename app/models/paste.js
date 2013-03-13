
function Paste(obj) {
  this.id = obj.id || null;
  this.created = obj.created || null;


  this.id = null;
  this.secret = null;
  this.username = null;
  this.summary = null;
  this.content = null;
  this.expire = null;
  this.created = null;
  this.encrypted = null;
  this.language = null;
  this.private = null;

  _.merge(this, {
      id: null,
      secret: null,
      username: null,
      summary: null,
      content: obj.content,
      expire: null,
      created: 
  });
}

