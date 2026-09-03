using Dapper;
using Npgsql;
using Scad.Inventory.Api.Errors;
using Scad.Inventory.Api.Models;

namespace Scad.Inventory.Api.Data;

public sealed class WarehouseRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<IReadOnlyList<Warehouse>> GetAllAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT id, code, name, created_at AS CreatedAt
            FROM warehouses
            ORDER BY code;
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var warehouses = await connection.QueryAsync<Warehouse>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return warehouses.AsList();
    }

    public async Task<Warehouse> CreateAsync(
        string code,
        string name,
        CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO warehouses (code, name)
            VALUES (@Code, @Name)
            RETURNING id, code, name, created_at AS CreatedAt;
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        try
        {
            return await connection.QuerySingleAsync<Warehouse>(
                new CommandDefinition(
                    sql,
                    new { Code = code, Name = name },
                    cancellationToken: cancellationToken));
        }
        catch (PostgresException exception)
            when (exception.SqlState == PostgresErrorCodes.UniqueViolation
                  && exception.ConstraintName == "uq_warehouses_code")
        {
            throw new AppException(
                StatusCodes.Status409Conflict,
                "DUPLICATE_WAREHOUSE_CODE",
                $"Warehouse code '{code}' already exists.");
        }
    }
}
