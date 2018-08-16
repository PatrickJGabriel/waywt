const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 60],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: [3, 100],
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [8, 60],
      },
    },
    FacebookId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true,
    },
  }, {
    indexes: [
      {
        fields: ['username'],
      },
      {
        fields: ['email'],
      },
      {
        fields: ['FacebookId'],
      },
    ],
  });

  User.beforeCreate((user) => {
    if (user.password) {
      user.password = bcrypt.hashSync(user.password, 8);
    }
  });

  User.prototype.validPassword = function validPassword(password) {
    return bcrypt.compareSync(password, this.password);
  };

  User.associate = (models) => {
    User.hasMany(models.Order);
  };

  return User;
};
