# ClipsApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**clipsControllerDelete**](ClipsApi.md#clipscontrollerdelete) | **DELETE** /clips/{id} | Delete a MIDI clip |
| [**clipsControllerFetch**](ClipsApi.md#clipscontrollerfetch) | **GET** /clips/{id} | Download a MIDI clip |
| [**clipsControllerSave**](ClipsApi.md#clipscontrollersave) | **POST** /clips | Store a MIDI clip |



## clipsControllerDelete

> clipsControllerDelete(id)

Delete a MIDI clip

### Example

```ts
import {
  Configuration,
  ClipsApi,
} from '';
import type { ClipsControllerDeleteRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClipsApi();

  const body = {
    // string | Clip UUID returned from POST /clips
    id: id_example,
  } satisfies ClipsControllerDeleteRequest;

  try {
    const data = await api.clipsControllerDelete(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | Clip UUID returned from POST /clips | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Deleted |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## clipsControllerFetch

> clipsControllerFetch(id)

Download a MIDI clip

### Example

```ts
import {
  Configuration,
  ClipsApi,
} from '';
import type { ClipsControllerFetchRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClipsApi();

  const body = {
    // string | Clip UUID returned from POST /clips
    id: id_example,
  } satisfies ClipsControllerFetchRequest;

  try {
    const data = await api.clipsControllerFetch(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` | Clip UUID returned from POST /clips | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | MIDI binary stream |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## clipsControllerSave

> SaveClipResponseDto clipsControllerSave(file)

Store a MIDI clip

### Example

```ts
import {
  Configuration,
  ClipsApi,
} from '';
import type { ClipsControllerSaveRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new ClipsApi();

  const body = {
    // Blob | MIDI binary file
    file: BINARY_DATA_HERE,
  } satisfies ClipsControllerSaveRequest;

  try {
    const data = await api.clipsControllerSave(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **file** | `Blob` | MIDI binary file | [Defaults to `undefined`] |

### Return type

[**SaveClipResponseDto**](SaveClipResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `multipart/form-data`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

