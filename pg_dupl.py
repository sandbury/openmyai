import psycopg2

# 连接到 KingbaseES 数据库
conn = psycopg2.connect(
    dbname="kingbase",
    user="kingbase",
    password="123456",
    host="223.4.251.109",
    port="54321"
)
conn.set_client_encoding('UTF8')
# 创建一个游标对象
cur = conn.cursor()

# 查询数据 默认使用 public 可以使用 your_schema_name.your_table_name 指定模式
cur.execute("SELECT DISTINCT item_name FROM cwgk_report_vb_cwys031 WHERE item_name IS NOT NULL")
rows = cur.fetchall()

# 打印查询结果
for row in rows:
    print(row)

# 关闭游标和连接
cur.close()
conn.close()
