import os
import logging
import hashlib
from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)

# create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "kinoshlek_clicker_secret_key_2025")

# configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///game.db"
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# initialize the app with the extension
db.init_app(app)

with app.app_context():
    # Make sure to import the models here or their tables won't be created
    import models  # noqa: F401
    db.create_all()

def get_or_create_player():
    """Get or create player for current session"""
    try:
        # Check if user is logged in with a registered account
        logged_in_user_id = session.get('logged_in_user_id')
        if logged_in_user_id:
            from models import Player
            player = Player.query.filter_by(id=logged_in_user_id).first()
            if player and player.password_hash:  # Make sure it's a registered player
                return player
        
        # For anonymous players, create/get session-based player
        session_id = session.get('session_id')
        
        if not session_id:
            session_id = os.urandom(16).hex()
            session['session_id'] = session_id
        
        from models import Player
        player = Player.query.filter_by(session_id=session_id, password_hash='').first()
        if not player:
            player = Player(
                session_id=session_id,
                name="",
                password_hash="",
                money=0,
                total_clicks=0,
                total_earned=0,
                films_count=0,
                film_cost=1000000,
                base_click_power=1500,
                bubbles_popped="0,0,0",
                current_promo=""
            )
            db.session.add(player)
            db.session.commit()
        
        return player
    except Exception as e:
        app.logger.error(f'Error in get_or_create_player: {str(e)}')
        # Create a basic fallback player
        session_id = os.urandom(16).hex()
        session['session_id'] = session_id
        from models import Player
        player = Player(
            session_id=session_id,
            name="",
            password_hash="",
            money=0,
            total_clicks=0,
            total_earned=0,
            films_count=0,
            film_cost=1000000,
            base_click_power=1500,
            bubbles_popped="0,0,0",
            current_promo=""
        )
        try:
            db.session.add(player)
            db.session.commit()
        except:
            pass
        return player

@app.route('/')
def index():
    """Main game page"""
    return render_template('index.html')


@app.route('/api/save_game', methods=['POST'])
def save_game():
    try:
        data = request.json
        player = get_or_create_player()
        
        # Update player data
        player.name = data.get('name', '')
        player.money = data.get('money', 0)
        player.total_clicks = data.get('totalClicks', 0)
        player.total_earned = data.get('totalEarned', 0)
        player.films_count = data.get('filmsCount', 0)
        player.film_cost = data.get('filmCost', 1000000)
        player.base_click_power = data.get('baseClickPower', 1500)
        player.bubbles_popped = ','.join(map(str, data.get('bubbles_popped', [0, 0, 0])))
        player.current_promo = data.get('current_promo', '')
        
        from models import PlayerUpgrade, PlayerManager
        
        # Update upgrades
        upgrades_data = data.get('upgrades', {})
        for upgrade_id, level in upgrades_data.items():
            upgrade = PlayerUpgrade.query.filter_by(player_id=player.id, upgrade_id=upgrade_id).first()
            if not upgrade:
                upgrade = PlayerUpgrade(player_id=player.id, upgrade_id=upgrade_id)
                db.session.add(upgrade)
            upgrade.level = level
        
        # Update managers
        managers_data = data.get('managers', {})
        for manager_id, manager_info in managers_data.items():
            manager = PlayerManager.query.filter_by(player_id=player.id, manager_id=manager_id).first()
            if not manager:
                manager = PlayerManager(player_id=player.id, manager_id=manager_id)
                db.session.add(manager)
            manager.level = manager_info.get('level', 0)
            manager.hired = manager_info.get('hired', False)
        
        db.session.commit()
        
        return jsonify({'success': True})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/load_game', methods=['GET'])
def load_game():
    try:
        player = get_or_create_player()
        
        from models import PlayerUpgrade, PlayerManager, PlayerFilm
        
        # Get upgrades
        upgrades = {}
        for upgrade in player.upgrades:
            upgrades[upgrade.upgrade_id] = upgrade.level
        
        # Get managers
        managers = {}
        for manager in player.managers:
            managers[manager.manager_id] = {
                'level': manager.level,
                'hired': manager.hired
            }
        
        # Get recent films
        recent_films = PlayerFilm.query.filter_by(player_id=player.id)\
            .order_by(PlayerFilm.created_at.desc()).limit(10).all()
        films = [film.to_dict() for film in recent_films]
        
        game_data = {
            'money': player.money,
            'totalClicks': player.total_clicks,
            'totalEarned': player.total_earned,
            'filmsCount': player.films_count,
            'filmCost': player.film_cost,
            'baseClickPower': player.base_click_power,
            'bubbles_popped': [int(x) for x in player.bubbles_popped.split(',')],
            'current_promo': player.current_promo,
            'name': player.name,
            'upgrades': upgrades,
            'managers': managers,
            'films': films
        }
        
        return jsonify({'success': True, 'data': game_data})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/save_film', methods=['POST'])
def save_film():
    try:
        data = request.json
        player = get_or_create_player()
        
        from models import PlayerFilm
        
        film = PlayerFilm(
            player_id=player.id,
            name=data['name'],
            cost=data['cost'],
            profit=data['profit']
        )
        
        db.session.add(film)
        db.session.commit()
        
        return jsonify({'success': True})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/unlock_achievement', methods=['POST'])
def unlock_achievement():
    try:
        data = request.json
        player = get_or_create_player()
        
        from models import PlayerAchievement
        
        achievement_id = data['achievement_id']
        
        # Check if already unlocked
        existing = PlayerAchievement.query.filter_by(
            player_id=player.id,
            achievement_id=achievement_id
        ).first()
        
        if not existing:
            achievement = PlayerAchievement(
                player_id=player.id,
                achievement_id=achievement_id
            )
            db.session.add(achievement)
            db.session.commit()
            
            return jsonify({'success': True, 'new_achievement': True})
        
        return jsonify({'success': True, 'new_achievement': False})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/get_achievements', methods=['GET'])
def get_achievements():
    try:
        player = get_or_create_player()
        
        from models import PlayerAchievement
        
        unlocked = []
        for achievement in player.achievements:
            unlocked.append(achievement.achievement_id)
        
        return jsonify({'success': True, 'unlocked': unlocked})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/register_player', methods=['POST'])
def register_player():
    try:
        data = request.json
        name = data.get('name', '').strip()
        password = data.get('password', '').strip()
        
        if not name:
            return jsonify({'success': False, 'error': 'Имя не может быть пустым'}), 400
        
        if len(name) < 3:
            return jsonify({'success': False, 'error': 'Имя должно содержать минимум 3 символа'}), 400
            
        if not password:
            return jsonify({'success': False, 'error': 'Пароль не может быть пустым'}), 400
            
        if len(password) < 4:
            return jsonify({'success': False, 'error': 'Пароль должен содержать минимум 4 символа'}), 400
        
        from models import Player
        
        # Check if nickname is already taken by any registered player
        existing_player = Player.query.filter(Player.name == name, Player.password_hash != '').first()
        
        if existing_player:
            return jsonify({'success': False, 'error': 'Этот никнейм уже занят'}), 400
        
        # Hash password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Get current player or create new one
        current_player = get_or_create_player()
        
        # Update current player to be registered
        current_player.name = name
        current_player.password_hash = password_hash
        
        db.session.commit()
        
        # Update session
        session['logged_in_user'] = name
        session['logged_in_user_id'] = current_player.id
        
        return jsonify({'success': True, 'returning_player': False})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f'Ошибка регистрации: {str(e)}'}), 500


@app.route('/api/login_player', methods=['POST'])
def login_player():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'Нет данных для входа'}), 400
            
        name = data.get('name', '').strip()
        password = data.get('password', '').strip()
        
        if not name or not password:
            return jsonify({'success': False, 'error': 'Введите никнейм и пароль'}), 400
        
        from models import Player
        
        # Hash the provided password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Find player with matching name and password (only registered players)
        player = Player.query.filter(
            Player.name == name, 
            Player.password_hash == password_hash,
            Player.password_hash != ''
        ).first()
        
        if not player:
            return jsonify({'success': False, 'error': 'Неверный никнейм или пароль'}), 400
        
        # Clear old session data completely
        session.clear()
        
        # Set new session data
        session['session_id'] = player.session_id
        session['logged_in_user'] = name
        session['logged_in_user_id'] = player.id
        
        return jsonify({'success': True})
    
    except Exception as e:
        app.logger.error(f'Login error: {str(e)}')
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Ошибка сервера при входе'}), 500

@app.route('/api/check_login', methods=['GET'])
def check_login():
    try:
        logged_in_user = session.get('logged_in_user')
        if logged_in_user:
            return jsonify({'success': True, 'logged_in': True, 'username': logged_in_user})
        else:
            return jsonify({'success': True, 'logged_in': False})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    try:
        session.pop('logged_in_user', None)
        session.pop('logged_in_user_id', None)
        session.pop('session_id', None)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/get_films', methods=['GET'])
def get_films():
    try:
        player = get_or_create_player()
        
        from models import PlayerFilm
        
        films = PlayerFilm.query.filter_by(player_id=player.id)\
            .order_by(PlayerFilm.created_at.desc()).limit(20).all()
        
        films_data = []
        for film in films:
            films_data.append({
                'name': film.name,
                'cost': film.cost,
                'profit': film.profit,
                'created_at': film.created_at.isoformat()
            })
        
        return jsonify({'success': True, 'films': films_data})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        from models import Player
        
        # Only show registered players (those with names AND passwords) ordered by money
        top_players = Player.query.filter(
            Player.name != '', 
            Player.name.isnot(None),
            Player.password_hash != '',
            Player.password_hash.isnot(None)
        ).order_by(Player.money.desc()).limit(5).all()
        
        leaderboard = []
        for i, player in enumerate(top_players, 1):
            leaderboard.append({
                'rank': i,
                'name': player.name,
                'money': player.money,
                'films_count': player.films_count
            })
        
        return jsonify({'success': True, 'leaderboard': leaderboard})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
