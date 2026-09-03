using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Dapper;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Scad.Inventory.IntegrationTests;

public sealed class InventoryApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:17-alpine")
        .WithDatabase("scad_inventory_tests")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        await ApplyDatabaseScriptsAsync();
    }

    public async Task ResetDatabaseAsync()
    {
        const string sql = """
            TRUNCATE TABLE stock, users, products, warehouses RESTART IDENTITY CASCADE;
            """;

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }

    public async Task<long> GetWarehouseIdAsync(string code)
    {
        const string sql = "SELECT id FROM warehouses WHERE code = @Code;";

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        return await connection.QuerySingleAsync<long>(sql, new { Code = code });
    }

    public async Task<int?> GetStockQuantityAsync(string productCode, string warehouseCode)
    {
        const string sql = """
            SELECT stock.quantity
            FROM stock
            JOIN products ON products.id = stock.product_id
            JOIN warehouses ON warehouses.id = stock.warehouse_id
            WHERE products.code = @ProductCode
              AND warehouses.code = @WarehouseCode;
            """;

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        return await connection.QuerySingleOrDefaultAsync<int?>(
            sql,
            new { ProductCode = productCode, WarehouseCode = warehouseCode });
    }

    public async Task<int> GetTotalStockAsync(string productCode)
    {
        const string sql = """
            SELECT COALESCE(SUM(stock.quantity), 0)::INTEGER
            FROM stock
            JOIN products ON products.id = stock.product_id
            WHERE products.code = @ProductCode;
            """;

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        return await connection.QuerySingleAsync<int>(sql, new { ProductCode = productCode });
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Database"] = _postgres.GetConnectionString()
                }));
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _postgres.DisposeAsync();
        Dispose();
    }

    private async Task ApplyDatabaseScriptsAsync()
    {
        var schema = await File.ReadAllTextAsync(
            Path.Combine(AppContext.BaseDirectory, "database", "001_schema.sql"));
        var seed = await File.ReadAllTextAsync(
            Path.Combine(AppContext.BaseDirectory, "database", "002_seed.sql"));

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand($"{schema}\n{seed}", connection);
        await command.ExecuteNonQueryAsync();
    }
}
