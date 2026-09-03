namespace Scad.Inventory.Api.Errors;

public sealed class AppException : Exception
{
    public AppException(
        int statusCode,
        string code,
        string message,
        IReadOnlyDictionary<string, string[]>? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        Code = code;
        Errors = errors;
    }

    public int StatusCode { get; }

    public string Code { get; }

    public IReadOnlyDictionary<string, string[]>? Errors { get; }

    public static AppException Validation(IReadOnlyDictionary<string, string[]> errors) =>
        new(StatusCodes.Status400BadRequest, "VALIDATION_ERROR", "The request is invalid.", errors);
}
