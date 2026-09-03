using Dapper;
using Npgsql;
using Scad.Inventory.Api.Errors;
using Scad.Inventory.Api.Models;

namespace Scad.Inventory.Api.Data;

public sealed class StockRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<Stock> CreateAsync(
        string productCode,
        string warehouseCode,
        int quantity,
        CancellationToken cancellationToken)
    {
        const string productSql = "SELECT id FROM products WHERE code = @Code;";
        const string warehouseSql = "SELECT id FROM warehouses WHERE code = @Code;";
        const string insertSql = """
            INSERT INTO stock (product_id, warehouse_id, quantity)
            VALUES (@ProductId, @WarehouseId, @Quantity)
            RETURNING product_id AS ProductId,
                      warehouse_id AS WarehouseId,
                      quantity,
                      updated_at AS UpdatedAt;
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var productId = await connection.QuerySingleOrDefaultAsync<long?>(
            new CommandDefinition(
                productSql,
                new { Code = productCode },
                cancellationToken: cancellationToken));

        if (productId is null)
        {
            throw new AppException(
                StatusCodes.Status404NotFound,
                "PRODUCT_NOT_FOUND",
                $"Product '{productCode}' was not found.");
        }

        var warehouseId = await connection.QuerySingleOrDefaultAsync<long?>(
            new CommandDefinition(
                warehouseSql,
                new { Code = warehouseCode },
                cancellationToken: cancellationToken));

        if (warehouseId is null)
        {
            throw new AppException(
                StatusCodes.Status404NotFound,
                "WAREHOUSE_NOT_FOUND",
                $"Warehouse '{warehouseCode}' was not found.");
        }

        try
        {
            return await connection.QuerySingleAsync<Stock>(
                new CommandDefinition(
                    insertSql,
                    new { ProductId = productId.Value, WarehouseId = warehouseId.Value, Quantity = quantity },
                    cancellationToken: cancellationToken));
        }
        catch (PostgresException exception)
            when (exception.SqlState == PostgresErrorCodes.UniqueViolation
                  && exception.ConstraintName == "pk_stock")
        {
            throw new AppException(
                StatusCodes.Status409Conflict,
                "STOCK_ALREADY_EXISTS",
                $"Initial stock already exists for product '{productCode}' at warehouse '{warehouseCode}'.");
        }
    }

    public async Task<IReadOnlyList<StockItem>> GetAsync(
        long authorizedWarehouseId,
        string? productCode,
        string? warehouseCode,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT product.code AS ProductCode,
                   product.description AS ProductDescription,
                   warehouse.code AS WarehouseCode,
                   warehouse.name AS WarehouseName,
                   stock.quantity
            FROM stock
            JOIN products AS product ON product.id = stock.product_id
            JOIN warehouses AS warehouse ON warehouse.id = stock.warehouse_id
            WHERE stock.warehouse_id = @AuthorizedWarehouseId
              AND (@ProductCode IS NULL OR product.code = @ProductCode)
              AND (@WarehouseCode IS NULL OR warehouse.code = @WarehouseCode)
            ORDER BY product.code, warehouse.code;
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var stock = await connection.QueryAsync<StockItem>(
            new CommandDefinition(
                sql,
                new
                {
                    AuthorizedWarehouseId = authorizedWarehouseId,
                    ProductCode = productCode,
                    WarehouseCode = warehouseCode
                },
                cancellationToken: cancellationToken));

        return stock.AsList();
    }
}
