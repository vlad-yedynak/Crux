using System.Text.Json;
using Crux.Models.Responses;
using Crux.Models.DTOs;

namespace Crux.Services;

public class ResourceSearchService (HttpClient httpClient) : IResourceSearchService
{
    public async Task<List<UserFeedResponse>> SearchResourcesAsync(string topic, int count = 3)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(topic))
            {
                return [];
            }

            count = Math.Max(1, Math.Min(count, 10));

            var searchResults = await PerformSearchAsync(topic, count);
            
            return searchResults.Select(result => new UserFeedResponse
            {
                Title = result.Title,
                Url = result.Link,
                Thumbnail = result.Thumbnail,
                Success = true
            }).ToList();
        }
        catch (Exception)
        {
            return new List<UserFeedResponse>
            {
                new UserFeedResponse
                {
                    Success = false,
                    Error = "Failed to search for resources"
                }
            };
        }
    }

    private async Task<List<SearchResult>> PerformSearchAsync(string topic, int count)
    {
        var apiKey = Environment.GetEnvironmentVariable("GOOGLE_SEARCH_API_KEY");
        var searchEngineId = Environment.GetEnvironmentVariable("GOOGLE_SEARCH_ENGINE_ID");

        if (!string.IsNullOrEmpty(apiKey) && !string.IsNullOrEmpty(searchEngineId))
        {
            return await SearchWithGoogleCustomSearchAsync(topic, count, apiKey, searchEngineId);
        }

        return [];
    }

    private async Task<List<SearchResult>> SearchWithGoogleCustomSearchAsync(string topic, int count, string apiKey, string searchEngineId)
    {
        var encodedTopic = Uri.EscapeDataString(topic);
        var url = $"https://www.googleapis.com/customsearch/v1" +
                  $"?key={apiKey}" +
                  $"&cx={searchEngineId}" +
                  $"&q={encodedTopic}" +
                  $"&num={count}";

        var response = await httpClient.GetStringAsync(url);
        var searchResponse = JsonSerializer.Deserialize<GoogleSearchResponse>(response);

        return searchResponse?.Items?.Select(item => new SearchResult
        {
            Title = item.Title ?? "No title",
            Link = item.Link ?? string.Empty,
            Thumbnail = item.PageMap?.CseThumbnail?.FirstOrDefault()?.Src
        }).ToList() ?? new List<SearchResult>();
        
        // TODO: Provide default thumbnail if Src is null
    }
}
