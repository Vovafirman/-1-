from app import db
from datetime import datetime


class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(128), unique=True, nullable=False)
    name = db.Column(db.String(100), default="")
    password_hash = db.Column(db.String(255), default="")
    money = db.Column(db.BigInteger, default=0)
    total_clicks = db.Column(db.BigInteger, default=0)
    total_earned = db.Column(db.BigInteger, default=0)
    films_count = db.Column(db.Integer, default=0)
    film_cost = db.Column(db.BigInteger, default=1000000)
    base_click_power = db.Column(db.Integer, default=1500)
    bubbles_popped = db.Column(db.String(20), default="0,0,0")  # Store as comma-separated values
    current_promo = db.Column(db.String(50), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    upgrades = db.relationship('PlayerUpgrade', backref='player', lazy=True, cascade='all, delete-orphan')
    managers = db.relationship('PlayerManager', backref='player', lazy=True, cascade='all, delete-orphan')
    films = db.relationship('PlayerFilm', backref='player', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'name': self.name,
            'money': self.money,
            'total_clicks': self.total_clicks,
            'total_earned': self.total_earned,
            'films_count': self.films_count,
            'film_cost': self.film_cost,
            'base_click_power': self.base_click_power,
            'bubbles_popped': [int(x) for x in self.bubbles_popped.split(',')],
            'current_promo': self.current_promo,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class PlayerUpgrade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    upgrade_id = db.Column(db.String(50), nullable=False)  # camera, lighting, actors, etc.
    level = db.Column(db.Integer, default=0)
    
    __table_args__ = (db.UniqueConstraint('player_id', 'upgrade_id'),)


class PlayerManager(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    manager_id = db.Column(db.String(50), nullable=False)  # assistant, producer, distributor, studio
    level = db.Column(db.Integer, default=0)
    hired = db.Column(db.Boolean, default=False)
    
    __table_args__ = (db.UniqueConstraint('player_id', 'manager_id'),)


class PlayerFilm(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    cost = db.Column(db.BigInteger, nullable=False)
    profit = db.Column(db.BigInteger, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'name': self.name,
            'cost': self.cost,
            'profit': self.profit,
            'created_at': self.created_at.isoformat()
        }


class PlayerAchievement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    achievement_id = db.Column(db.String(50), nullable=False)
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    player = db.relationship('Player', backref='achievements')
    
    __table_args__ = (db.UniqueConstraint('player_id', 'achievement_id'),)