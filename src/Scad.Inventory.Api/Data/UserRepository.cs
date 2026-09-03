using Dapper;
using Scad.Inventory.Api.Models;

namespace Scad.Inventory.Api.Data;

public sealed class UserRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<User?> GetByUsernameAsync(
        string username,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT users.id,
                   users.username,
                   users.password_hash AS PasswordHash,
                   users.warehouse_id AS WarehouseId,
                   warehouses.code AS WarehouseCode
            FROM users
            JOIN warehouses ON warehouses.id = users.warehouse_id
            WHERE users.username = @Username;
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<User>(
            new CommandDefinition(sql, new { Username = username }, cancellationToken: cancellationToken));
    }
}
