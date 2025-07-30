import os
import json
import logging
from flask import Flask, render_template, request, jsonify, session
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "kinoshlek_clicker_secret_key_2025")

# Ensure saves directory exists
os.makedirs('saves', exist_ok=True)

def get_save_filename():
    """Get save filename for current session"""
    session_id = session.get('session_id')
    if not session_id:
        session_id = os.urandom(16).hex()
        session['session_id'] = session_id
    return f'saves/game_{session_id}.json'

def load_game_data():
    """Load game data for current session"""
    filename = get_save_filename()
    
    default_data = {
        'name': '',
        'money': 0,
        'totalClicks': 0,
        'totalEarned': 0,
        'filmsCount': 0,
        'filmCost': 1000000,
        'baseClickPower': 1500,
        'bubbles_popped': [0, 0, 0],
        'current_promo': '',
        'upgrades': {},
        'managers': {},
        'achievements': [],
        'films': []
    }
    
    try:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        logging.error(f"Error loading game data: {e}")
    
    return default_data

def save_game_data(data):
    """Save game data for current session"""
    filename = get_save_filename()
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logging.error(f"Error saving game data: {e}")
        return False

@app.route('/')
def index():
    """Main game page"""
    return render_template('index.html')

@app.route('/api/save_game', methods=['POST'])
def save_game():
    try:
        data = request.json
        if save_game_data(data):
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to save'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/load_game', methods=['GET'])
def load_game():
    try:
        data = load_game_data()
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/unlock_achievement', methods=['POST'])
def unlock_achievement():
    try:
        data = request.json
        achievement_id = data.get('achievement_id')
        
        game_data = load_game_data()
        
        if achievement_id not in game_data.get('achievements', []):
            game_data.setdefault('achievements', []).append(achievement_id)
            save_game_data(game_data)
            return jsonify({'success': True, 'new_achievement': True})
        
        return jsonify({'success': True, 'new_achievement': False})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/get_achievements', methods=['GET'])
def get_achievements():
    try:
        game_data = load_game_data()
        unlocked = game_data.get('achievements', [])
        return jsonify({'success': True, 'unlocked': unlocked})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/register_player', methods=['POST'])
def register_player():
    try:
        data = request.json
        name = data.get('name', '').strip()
        
        if not name:
            return jsonify({'success': False, 'error': 'Имя не может быть пустым'}), 400
        
        if len(name) < 3:
            return jsonify({'success': False, 'error': 'Имя должно содержать минимум 3 символа'}), 400
        
        # Check if name is taken by loading all save files
        taken_names = set()
        saves_dir = 'saves'
        if os.path.exists(saves_dir):
            for filename in os.listdir(saves_dir):
                if filename.startswith('game_') and filename.endswith('.json'):
                    try:
                        with open(os.path.join(saves_dir, filename), 'r', encoding='utf-8') as f:
                            file_data = json.load(f)
                            if file_data.get('name'):
                                taken_names.add(file_data['name'])
                    except:
                        continue
        
        if name in taken_names:
            return jsonify({'success': False, 'error': 'Это имя уже занято'}), 400
        
        # Save name to current game
        game_data = load_game_data()
        game_data['name'] = name
        save_game_data(game_data)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        players = []
        saves_dir = 'saves'
        
        if os.path.exists(saves_dir):
            for filename in os.listdir(saves_dir):
                if filename.startswith('game_') and filename.endswith('.json'):
                    try:
                        with open(os.path.join(saves_dir, filename), 'r', encoding='utf-8') as f:
                            file_data = json.load(f)
                            if file_data.get('name'):  # Only include named players
                                players.append({
                                    'name': file_data['name'],
                                    'money': file_data.get('money', 0),
                                    'films_count': file_data.get('filmsCount', 0)
                                })
                    except:
                        continue
        
        # Sort by money and take top 5
        players.sort(key=lambda x: x['money'], reverse=True)
        top_players = players[:5]
        
        # Add rank
        leaderboard = []
        for i, player in enumerate(top_players, 1):
            leaderboard.append({
                'rank': i,
                'name': player['name'],
                'money': player['money'],
                'films_count': player['films_count']
            })
        
        return jsonify({'success': True, 'leaderboard': leaderboard})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)