INSERT INTO warehouses (code, name)
VALUES
    ('JHB', 'Johannesburg Warehouse'),
    ('CPT', 'Cape Town Warehouse');

INSERT INTO products (code, description)
VALUES ('ABC001', 'Widget');

INSERT INTO stock (product_id, warehouse_id, quantity)
SELECT product.id, warehouse.id, seeded_stock.quantity
FROM (
    VALUES
        ('ABC001', 'JHB', 100),
        ('ABC001', 'CPT', 20)
) AS seeded_stock(product_code, warehouse_code, quantity)
JOIN products AS product ON product.code = seeded_stock.product_code
JOIN warehouses AS warehouse ON warehouse.code = seeded_stock.warehouse_code;

INSERT INTO users (username, password_hash, warehouse_id)
SELECT seeded_user.username, seeded_user.password_hash, warehouse.id
FROM (
    VALUES
        ('jhb@scad.local', '$2b$12$go5SzFKWYAA0mnszafdl/.pTWYVquKkMXjep5Oun/I9XGcBH7J1Ee', 'JHB'),
        ('cpt@scad.local', '$2b$12$go5SzFKWYAA0mnszafdl/.pTWYVquKkMXjep5Oun/I9XGcBH7J1Ee', 'CPT')
) AS seeded_user(username, password_hash, warehouse_code)
JOIN warehouses AS warehouse ON warehouse.code = seeded_user.warehouse_code;
