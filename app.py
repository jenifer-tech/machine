from flask import Flask, render_template, request, jsonify
import mysql.connector
from datetime import datetime

app = Flask(__name__)

# MySQL configuration
db_config = {
    'user': 'sql12724389',
    'password': 'XYTxIn4Qyy',
    'host': 'sql12.freemysqlhosting.net',
    'database': 'sql12724389'
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit():
    if request.method == 'POST':
        cus_name = request.form['cus_name']
        cus_address = request.form['cus_address']
        cus_phoneno = request.form['cus_phoneno']
        machine_name = request.form['machine_name']
        count = request.form['count'] or None
        out_time = request.form['out_time']
        in_time = request.form['in_time'] or None
        rate = request.form['rate'] or None

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        query = ("INSERT INTO machines (cus_name, cus_address, cus_phoneno, machine_name, count, out_time, in_time, rate) "
                 "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)")
        data = (cus_name, cus_address, cus_phoneno, machine_name, count, out_time, in_time, rate)
        cursor.execute(query, data)
        conn.commit()

        cursor.close()
        conn.close()

        response = {
            'message': f'Machine "{machine_name}" is given to "{cus_name}" in "{out_time}"'
        }
        return jsonify(response)

@app.route('/get_records', methods=['POST'])
def get_records():
    start_date = request.form['start_date']
    end_date = request.form['end_date']

    start_datetime = datetime.strptime(start_date, '%Y-%m-%d').replace(hour=0, minute=0, second=0)
    end_datetime = datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59)

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT * FROM machines 
        WHERE (out_time >= %s AND out_time <= %s) 
        OR (in_time >= %s AND in_time <= %s)
    """
    cursor.execute(query, (start_datetime, end_datetime, start_datetime, end_datetime))
    records = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({'records': records})

@app.route('/edit_record', methods=['POST'])
def edit_record():
    record_id = request.form['id']
    in_time_str = request.form['in_time']  # Get in_time as a string
    in_time = datetime.strptime(in_time_str, '%Y-%m-%dT%H:%M') if in_time_str else None

    # Fetch the original out_time from the database
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT out_time FROM machines WHERE id = %s", (record_id,))
    result = cursor.fetchone()

    if result:
        out_time_str = result['out_time']
        if isinstance(out_time_str, str):  # Ensure out_time_str is a string
            out_time = datetime.strptime(out_time_str, '%Y-%m-%d %H:%M:%S') if out_time_str else None

            if out_time and in_time:
                # Calculate the rate based on the time difference
                time_difference = in_time - out_time
                hours = time_difference.total_seconds() / 3600
                rate = hours * 10  # Example: rate is $10 per hour

                # Update the database with the new in_time and calculated rate
                cursor.execute(
                    "UPDATE machines SET in_time = %s, rate = %s WHERE id = %s",
                    (in_time, rate, record_id)
                )
                conn.commit()
                
                response = {
                    'machine_name': request.form.get('machine_name', 'Unknown'),  # Defalt value if not found
                    'rate': rate
                }
            else:
                response = {
                    'error': 'Unable to calculate rate. Check in_time and out_time.'
                }
        else:
            response = {
                'error': 'Invalid out_time format.'
            }
    else:
        response = {
            'error': 'Record not found or in_time not provided.'
        }
    
    cursor.close()
    conn.close()

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
