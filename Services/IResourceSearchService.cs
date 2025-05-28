using Crux.Models.Responses;

namespace Crux.Services;

public interface IResourceSearchService
{
    Task<List<UserFeedResponse>> SearchResourcesAsync(string topic, int count = 3);
}
