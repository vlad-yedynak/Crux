using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class ControllerResponse<T> : IResponse
{
    public required bool Success { get; set; }
    public string? Error { get; set; }
    
    [JsonPropertyName("body")]
    public T? Body { get; set; }
}
