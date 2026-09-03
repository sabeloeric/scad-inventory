using Dapper;
using Scad.Inventory.Api.Contracts.Orders;
using Scad.Inventory.Api.Data;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.Api.Services;

public sealed class StockTransferService(IDbConnectionFactory connectionFactory)
{
    public async Task<TransferResponse> TransferAsync(
        ValidatedStockTransfer request,
        CancellationToken cancellationToken)
    {
        const string productSql = "SELECT id FROM products WHERE code = @Code;";
        const string warehouseSql = "SELECT id FROM warehouses WHERE code = @Code;";
        const string ensureDestinationSql = """
            INSERT INTO stock (product_id, warehouse_id, quantity)
            VALUES (@ProductId, @WarehouseId, 0)
            ON CONFLICT (product_id, warehouse_id) DO NOTHING;
            """;
        const string lockStockSql = """
            SELECT warehouse_id AS WarehouseId,
                   quantity
            FROM stock
            WHERE product_id = @ProductId
              AND warehouse_id = ANY(@WarehouseIds)
            ORDER BY warehouse_id
            FOR UPDATE;
            """;
        const string updateStockSql = """
            UPDATE stock
            SET quantity = quantity + @QuantityChange,
                updated_at = NOW()
            WHERE product_id = @ProductId
              AND warehouse_id = @WarehouseId;
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        var productId = await connection.QuerySingleOrDefaultAsync<long?>(
            new CommandDefinition(
                productSql,
                new { Code = request.ProductCode },
                transaction,
                cancellationToken: cancellationToken));

        if (productId is null)
        {
            throw NotFound("PRODUCT_NOT_FOUND", "Product", request.ProductCode);
        }

        var sourceWarehouseId = await connection.QuerySingleOrDefaultAsync<long?>(
            new CommandDefinition(
                warehouseSql,
                new { Code = request.SourceWarehouseCode },
                transaction,
                cancellationToken: cancellationToken));

        if (sourceWarehouseId is null)
        {
            throw NotFound("WAREHOUSE_NOT_FOUND", "Warehouse", request.SourceWarehouseCode);
        }

        var destinationWarehouseId = await connection.QuerySingleOrDefaultAsync<long?>(
            new CommandDefinition(
                warehouseSql,
                new { Code = request.DestinationWarehouseCode },
                transaction,
                cancellationToken: cancellationToken));

        if (destinationWarehouseId is null)
        {
            throw NotFound("WAREHOUSE_NOT_FOUND", "Warehouse", request.DestinationWarehouseCode);
        }

        await connection.ExecuteAsync(
            new CommandDefinition(
                ensureDestinationSql,
                new { ProductId = productId.Value, WarehouseId = destinationWarehouseId.Value },
                transaction,
                cancellationToken: cancellationToken));

        var warehouseIds = new[] { sourceWarehouseId.Value, destinationWarehouseId.Value };
        Array.Sort(warehouseIds);

        var lockedStock = (await connection.QueryAsync<LockedStock>(
            new CommandDefinition(
                lockStockSql,
                new { ProductId = productId.Value, WarehouseIds = warehouseIds },
                transaction,
                cancellationToken: cancellationToken))).AsList();

        var source = lockedStock.SingleOrDefault(item => item.WarehouseId == sourceWarehouseId.Value);
        var destination = lockedStock.Single(item => item.WarehouseId == destinationWarehouseId.Value);

        if (source is null || source.Quantity < request.Quantity)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new AppException(
                StatusCodes.Status400BadRequest,
                "INSUFFICIENT_STOCK",
                $"Warehouse '{request.SourceWarehouseCode}' has insufficient stock for product '{request.ProductCode}'.");
        }

        await connection.ExecuteAsync(
            new CommandDefinition(
                updateStockSql,
                new
                {
                    ProductId = productId.Value,
                    WarehouseId = sourceWarehouseId.Value,
                    QuantityChange = -request.Quantity
                },
                transaction,
                cancellationToken: cancellationToken));

        await connection.ExecuteAsync(
            new CommandDefinition(
                updateStockSql,
                new
                {
                    ProductId = productId.Value,
                    WarehouseId = destinationWarehouseId.Value,
                    QuantityChange = request.Quantity
                },
                transaction,
                cancellationToken: cancellationToken));

        await transaction.CommitAsync(cancellationToken);

        return new TransferResponse(
            request.ProductCode,
            request.Quantity,
            new TransferSourceResponse(
                request.SourceWarehouseCode,
                source.Quantity - request.Quantity),
            new TransferDestinationResponse(
                request.DestinationWarehouseCode,
                destination.Quantity + request.Quantity));
    }

    private static AppException NotFound(string code, string resource, string value) =>
        new(StatusCodes.Status404NotFound, code, $"{resource} '{value}' was not found.");

    private sealed record LockedStock(long WarehouseId, int Quantity);
}
