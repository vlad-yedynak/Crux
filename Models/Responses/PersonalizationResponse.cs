using System.Text.Json.Serialization;

namespace Crux.Models.Responses;

public class PersonalizationResponse : Response
{
    [JsonPropertyName("trackedTime")]
    public double? TrackedTime { get; set; }
}
