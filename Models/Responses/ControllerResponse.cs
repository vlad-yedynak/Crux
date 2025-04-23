using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class ControllerResponse<T> : Response
{
    [JsonPropertyName("body")]
    public T? Body { get; set; }
}
