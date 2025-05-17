# Azure OpenAI Responses API (Preview)

## Overview

The Responses API is a new stateful API from Azure OpenAI. It unifies the best capabilities from the chat completions and assistants APIs, offering one powerful experience. The Responses API also introduces the `computer-use-preview` model, which powers the [Computer use](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/computer-use) capability.

---

## API Support

- **Supported API Version:** `2025-03-01-preview` or later

---

## Model Support

- `gpt-4o` (Versions: `2024-11-20`, `2024-08-06`, `2024-05-13`)
- `gpt-4o-mini` (Version: `2024-07-18`)
- `computer-use-preview`
- `gpt-4.1` (Version: `2025-04-14`)
- `gpt-4.1-nano` (Version: `2025-04-14`)
- `gpt-4.1-mini` (Version: `2025-04-14`)
- `gpt-image-1` (Version: `2025-04-15`)
- `o3` (Version: `2025-04-16`)
- `o4-mini` (Version: `2025-04-16`)

_Note: Not every model is available in all regions. See the_ [models page](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models) _for region-specific availability._

**Not Currently Supported:**
- Structured outputs
- image_url pointing to an internet address
- The web search tool
- Fine-tuned models

> **Vision performance note:** There is a known issue with vision performance (especially OCR). As a temporary workaround, set image detail to `high`. The article will be updated once this issue is resolved.

---

## Reference Documentation

- [Responses API reference documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference-preview?#responses-api---create)

---

## Getting Started with the Responses API

Upgrade your OpenAI library to use Responses API:

```console
pip install --upgrade openai
```

---

## Generate a Text Response

- [Python (Microsoft Entra ID)](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/responses?tabs=python-key#tabpanel_1_python-secure)
- [Python (API Key)](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/responses?tabs=python-key#tabpanel_1_python-key)
- [REST API](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/responses?tabs=python-key#tabpanel_1_rest-api)
- [Sample Output](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/responses?tabs=python-key#tabpanel_1_output)

#### Python (Microsoft Entra ID)

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_ad_token_provider=token_provider,
    api_version="2025-03-01-preview"
)
response = client.responses.create(
    model="gpt-4o", # replace with your model deployment name
    input="This is a test."
    # truncation="auto" required when using computer-use-preview model.
)
```

#### Python (API Key)

```python
import os
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2025-03-01-preview",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)
response = client.responses.create(
    model="gpt-4o", # replace with your model deployment name
    input="This is a test."
    # truncation="auto" required when using computer-use-preview model.
)
```

#### REST (Microsoft Entra ID)

```bash
curl -X POST "https://YOUR-RESOURCE-NAME.openai.azure.com/openai/responses?api-version=2025-03-01-preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AZURE_OPENAI_AUTH_TOKEN" \
  -d '{ "model": "gpt-4o", "input": "This is a test" }'
```

#### REST (API Key)

```bash
curl -X POST https://YOUR-RESOURCE-NAME.openai.azure.com/openai/responses?api-version=2025-03-01-preview \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_OPENAI_API_KEY" \
  -d '{ "model": "gpt-4o", "input": "This is a test" }'
```

#### Output

```json
{
  "id": "resp_67cb32528d6881909eb2859a55e18a85",
  "created_at": 1741369938.0,
  "error": null,
  "incomplete_details": null,
  "instructions": null,
  "metadata": {},
  "model": "gpt-4o-2024-08-06",
  "object": "response",
  "output": [
    {
      "id": "msg_67cb3252cfac8190865744873aada798",
      "content": [
        {
          "annotations": [],
          "text": "Great! How can I help you today?",
          "type": "output_text"
        }
      ],
      "role": "assistant",
      "status": null,
      "type": "message"
    }
  ],
  "output_text": "Great! How can I help you today?",
  "parallel_tool_calls": null,
  "temperature": 1.0,
  "tool_choice": null,
  "tools": [],
  "top_p": 1.0,
  "max_output_tokens": null,
  "previous_response_id": null,
  "reasoning": null,
  "status": "completed",
  "text": null,
  "truncation": null,
  "usage": {
    "input_tokens": 20,
    "output_tokens": 11,
    "output_tokens_details": { "reasoning_tokens": 0 },
    "total_tokens": 31
  },
  "user": null,
  "reasoning_effort": null
}
```

> **Important:**  
> Use API keys with caution. Don’t include them directly in your code, and never post them publicly. Store API keys securely in [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/apps-api-keys-secrets).  
> For authentication security, see [Authenticate requests to Azure AI services](https://learn.microsoft.com/en-us/azure/ai-services/authentication).

---

## Retrieve a Response

Retrieve a response from a previous call to the responses API.

#### Python (Microsoft Entra ID)

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_ad_token_provider=token_provider,
    api_version="2025-03-01-preview"
)
response = client.responses.retrieve("resp_67cb61fa3a448190bcf2c42d96f0d1a8")
print(response.model_dump_json(indent=2))
```

#### Python (API Key)

```python
import os
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2025-03-01-preview",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)
response = client.responses.retrieve("resp_67cb61fa3a448190bcf2c42d96f0d1a8")
```

#### REST (Microsoft Entra ID)

```bash
curl -X GET "https://YOUR-RESOURCE-NAME.openai.azure.com/openai/responses/{response_id}?api-version=2025-03-01-preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AZURE_OPENAI_AUTH_TOKEN"
```

#### REST (API Key)

```bash
curl -X GET https://YOUR-RESOURCE-NAME.openai.azure.com/openai/responses/{response_id}?api-version=2025-03-01-preview \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_OPENAI_API_KEY"
```

#### Output

```json
{
  "id": "resp_67cb61fa3a448190bcf2c42d96f0d1a8",
  "created_at": 1741382138.0,
  "error": null,
  "incomplete_details": null,
  "instructions": null,
  "metadata": {},
  "model": "gpt-4o-2024-08-06",
  "object": "response",
  "output": [
    {
      "id": "msg_67cb61fa95588190baf22ffbdbbaaa9d",
      "content": [
        {
          "annotations": [],
          "text": "Hello! How can I assist you today?",
          "type": "output_text"
        }
      ],
      "role": "assistant",
      "status": null,
      "type": "message"
    }
  ],
  "parallel_tool_calls": null,
  "temperature": 1.0,
  "tool_choice": null,
  "tools": [],
  "top_p": 1.0,
  "max_output_tokens": null,
  "previous_response_id": null,
  "reasoning": null,
  "status": "completed",
  "text": null,
  "truncation": null,
  "usage": {
    "input_tokens": 20,
    "output_tokens": 11,
    "output_tokens_details": { "reasoning_tokens": 0 },
    "total_tokens": 31
  },
  "user": null,
  "reasoning_effort": null
}
```

---

## Delete Response

By default, response data is retained for 30 days. To delete a response:

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_ad_token_provider=token_provider,
    api_version="2025-03-01-preview"
)
response = client.responses.delete("resp_67cb61fa3a448190bcf2c42d96f0d1a8")
print(response)
```

---

## Chaining Responses Together

Chain responses by passing the `response.id` from the previous result to `previous_response_id`:

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_ad_token_provider=token_provider,
    api_version="2025-03-01-preview"
)
response = client.responses.create(
    model="gpt-4o",  # replace with your model deployment name
    input="Define and explain the concept of catastrophic forgetting?"
)
second_response = client.responses.create(
    model="gpt-4o",  # replace with your model deployment name
    previous_response_id=response.id,
    input=[{"role": "user", "content": "Explain this at a level that could be understood by a college freshman"}]
)
print(second_response.model_dump_json(indent=2))
```

_Note: Even if you don't send the original input again, the model preserves full conversational context using_ `previous_response_id`.

**Sample Output:**

```json
{
  "id": "resp_67cbc9705fc08190bbe455c5ba3d6daf",
  "created_at": 1741408624.0,
  "error": null,
  "incomplete_details": null,
  "instructions": null,
  "metadata": {},
  "model": "gpt-4o-2024-08-06",
  "object": "response",
  "output": [
    {
      "id": "msg_67cbc970fd0881908353a4298996b3f6",
      "content": [
        {
          "annotations": [],
          "text": "Sure! Imagine you are studying for exams in different subjects like math, history, and biology. ... Scientists and engineers are working on ways to help computers remember everything they learn, even as they keep learning new things, just like students have to remember math, history, and biology all at the same time for their exams.",
          "type": "output_text"
        }
      ],
      "role": "assistant",
      "status": null,
      "type": "message"
    }
  ],
  "parallel_tool_calls": null,
  "temperature": 1.0,
  "tool_choice": null,
  "tools": [],
  "top_p": 1.0,
  "max_output_tokens": null,
  "previous_response_id": "resp_67cbc96babbc8190b0f69aedc655f173",
  "reasoning": null,
  "status": "completed",
  "text": null,
  "truncation": null,
  "usage": {
    "input_tokens": 405,
    "output_tokens": 285,
    "output_tokens_details": { "reasoning_tokens": 0 },
    "total_tokens": 690
  },
  "user": null,
  "reasoning_effort": null
}
```

---

### Chaining Responses Manually

You can also maintain the conversational context manually:

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_ad_token_provider=token_provider,
    api_version="2025-03-01-preview"
)
inputs = [{"type": "message", "role": "user", "content": "Define and explain the concept of catastrophic forgetting?"}]
response = client.responses.create(
    model="gpt-4o",  # replace with your model deployment name
    input=inputs
)
inputs += response.output
inputs.append({"role": "user", "type": "message", "content": "Explain this at a level that could be understood by a college freshman"})
second_response = client.responses.create(
    model="gpt-4o",
    input=inputs
)
print(second_response.model_dump_json(indent=2))
```

---

## Streaming

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_ad_token_provider=token_provider,
    api_version="2025-04-01-preview"
)
response = client.responses.create(
    input="This is a test",
    model="o4-mini",  # replace with model deployment name
    stream=True
)
for event in response:
    if event.type == 'response.output_text.delta':
        print(event.delta, end='')
```

---

## Function Calling

The Responses API supports function calling.

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_ad_token_provider=token_provider,
    api_version="2025-03-01-preview"
)
response = client.responses.create(
    model="gpt-4o",  # replace with your model deployment name
    tools=[
        {
            "type": "function",
            "name": "get_weather",
            "description": "Get the weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            }
        }
    ],
    input=[{"role": "user", "content": "What's the weather in San Francisco?"}]
)
print(response.model_dump_json(indent=2))

# To provide output to tools, add a response for each tool call to an array passed
# to the next response as `input`
input = []
for output in response.output:
    if output.type == "function_call":
        match output.name:
            case "get_weather":
                input.append(
                    {
                        "type": "function_call_output",
                        "call_id": output.call_id,
                        "output": '{"temperature": "70 degrees"}',
                    }
                )
            case _:
                raise ValueError(f"Unknown function call: {output.name}")
second_response = client.responses.create(
    model="gpt-4o",
    previous_response_id=response.id,
    input=input
)
print(second_response.model_dump_json(indent=2))
```

---

## List Input Items

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_ad_token_provider=token_provider,
    api_version="2025-03-01-preview"
)
response = client.responses.input_items.list("resp_67d856fcfba0819081fd3cffee2aa1c0")
print(response.model_dump_json(indent=2))
```

**Sample Output:**

```json
{
  "data": [
    {
      "id": "msg_67d856fcfc1c8190ad3102fc01994c5f",
      "content": [
        {
          "text": "This is a test.",
          "type": "input_text"
        }
      ],
      "role": "user",
      "status": "completed",
      "type": "message"
    }
  ],
  "has_more": false,
  "object": "list",
  "first_id": "msg_67d856fcfc1c8190ad3102fc01994c5f",
  "last_id": "msg_67d856fcfc1c8190ad3102fc01994c5f"
}
```

---

## Image Input

**Note:** There is a known issue with image URL-based input—currently, only base64-encoded images are supported.

### Image URL

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_ad_token_provider=token_provider,
    api_version="2025-03-01-preview"
)
response = client.responses.create(
    model="gpt-4o",
    input=[
        {
            "role": "user",
            "content": [
                { "type": "input_text", "text": "what is in this image?" },
                { "type": "input_image", "image_url": "<image_URL>" }
            ]
        }
    ]
)
print(response)
```

### Base64 Encoded Image

```python
import base64
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    azure_ad_token_provider=token_provider,
    api_version="2025-03-01-preview"
)
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")
# Path to your image
image_path = "path_to_your_image.jpg"
# Getting the Base64 string
base64_image = encode_image(image_path)
response = client.responses.create(
    model="gpt-4o",
    input=[
        {
            "role": "user",
            "content": [
                { "type": "input_text", "text": "what is in this image?" },
                { "type": "input_image", "image_url": f"data:image/jpeg;base64,{base64_image}" }
            ]
        }
    ]
)
print(response)
```

---
## Reasoning Models

Azure OpenAI `o-series` models are designed to tackle reasoning and problem-solving tasks with increased focus and capability. These models spend more time processing and understanding the user's request, making them exceptionally strong in areas like science, coding, and math compared to previous iterations.

**Key capabilities of the o-series models:**

- Complex Code Generation: Capable of generating algorithms and handling advanced coding tasks to support developers.
- Advanced Problem Solving: Ideal for comprehensive brainstorming sessions and addressing multifaceted challenges.
- Complex Document Comparison: Perfect for analyzing contracts, case files, or legal documents to identify subtle differences.
- Instruction Following and Workflow Management: Particularly effective for managing workflows requiring shorter contexts.

## Availability

### Region availability

|Model|Region|Limited access|
|---|---|---|
|`o4-mini`|East US2 (Global Standard)<br><br>Sweden Central (Global Standard)|No access request needed to use the core capabilities of this model.<br><br>Request access: [o4-mini reasoning summary feature](https://aka.ms/oai/o3access)|
|`o3`|East US2 (Global Standard)<br><br>Sweden Central (Global Standard)|Request access: [o3 limited access model application](https://aka.ms/oai/o3access)|
|`o3-mini`|[Model availability](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#global-standard-model-availability).|Access is no longer restricted for this model.|
|`o1`|[Model availability](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#global-standard-model-availability).|Access is no longer restricted for this model.|
|`o1-preview`|[Model availability](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#global-standard-model-availability).|This model is only available for customers who were granted access as part of the original limited access release. We're currently not expanding access to `o1-preview`.|
|`o1-mini`|[Model availability](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#global-standard-model-availability).|No access request needed for Global Standard deployments.<br><br>Standard (regional) deployments are currently only available to select customers who were previously granted access as part of the `o1-preview` release.|

## API & feature support

|**Feature**|**o4-mini**, **2025-04-16**|**o3**, **2025-04-16**|**o3-mini**, **2025-01-31**|**o1**, **2024-12-17**|**o1-preview**, **2024-09-12**|**o1-mini**, **2024-09-12**|
|---|---|---|---|---|---|---|
|**API Version**|`2025-04-01-preview`|`2025-04-01-preview`|`2024-12-01-preview` or later  <br>`2025-03-01-preview` (Recommended)|`2024-12-01-preview` or later  <br>`2025-03-01-preview` (Recommended)|`2024-09-01-preview` or later  <br>`2025-03-01-preview` (Recommended)|`2024-09-01-preview` or later  <br>`2025-03-01-preview` (Recommended)|
|**[Developer Messages](#developer-messages)**|✅|✅|✅|✅|-|-|
|**[Structured Outputs](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/structured-outputs)**|✅|✅|✅|✅|-|-|
|**[Context Window](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#o-series-models)**|Input: 200,000  <br>Output: 100,000|Input: 200,000  <br>Output: 100,000|Input: 200,000  <br>Output: 100,000|Input: 200,000  <br>Output: 100,000|Input: 128,000  <br>Output: 32,768|Input: 128,000  <br>Output: 65,536|
|**[Reasoning effort](#reasoning-effort)**|✅|✅|✅|✅|-|-|
|**[Vision Support](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/gpt-with-vision)**|✅|✅|-|✅|-|-|
|Chat Completions API|✅|✅|✅|✅|✅|✅|
|Responses API|✅|✅|-|-|-|-|
|Functions/Tools|✅|✅|✅|✅|-|-|
|Parallel Tool Calls|-|-|-|-|-|-|
|`max_completion_tokens` 1|✅|✅|✅|✅|✅|✅|
|System Messages 2|✅|✅|✅|✅|-|-|
|[Reasoning summary](#reasoning-summary) 3|✅|✅|-|-|-|-|
|Streaming 4|✅|✅|✅|-|-|-|

1 Reasoning models will only work with the `max_completion_tokens` parameter.

2 The latest o* series model support system messages to make migration easier. When you use a system message with `o4-mini`, `o3`, `o3-mini`, and `o1` it will be treated as a developer message. You should not use both a developer message and a system message in the same API request.

3 Access to the chain-of-thought reasoning summary is limited access only for `o3` & `o4-mini`.

4 Streaming for `o3` is limited access only.

### Not Supported

The following are currently unsupported with reasoning models:

- `temperature`, `top_p`, `presence_penalty`, `frequency_penalty`, `logprobs`, `top_logprobs`, `logit_bias`, `max_tokens`

## Usage

These models [don't currently support the same set of parameters](#api--feature-support) as other models that use the chat completions API.

- [Python (Microsoft Entra ID)](#tabpanel_1_python-secure)
- [Python (key-based auth)](#tabpanel_1_python)
- [C#](#tabpanel_1_csharp)

You might need to upgrade your version of the OpenAI Python library to take advantage of the new parameters like `max_completion_tokens`.

```bash
pip install openai --upgrade
```

```python

from openai import AzureOpenAI

client = AzureOpenAI(
  azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT"), 
  api_key=os.getenv("AZURE_OPENAI_API_KEY"),  
  api_version="2025-03-01-preview"
)

response = client.chat.completions.create(
    model="o1-new", # replace with the model deployment name of your o1 deployment.
    messages=[
        {"role": "user", "content": "What steps should I think about when writing my first Python API?"},
    ],
    max_completion_tokens = 5000

)

print(response.model_dump_json(indent=2))
```

**Python Output:**

```json
{
  "id": "chatcmpl-AEj7pKFoiTqDPHuxOcirA9KIvf3yz",
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "logprobs": null,
      "message": {
        "content": "Writing your first Python API is an exciting step in developing software that can communicate with other applications. An API (Application Programming Interface) allows different software systems to interact with each other, enabling data exchange and functionality sharing. Here are the steps you should consider when creating your first Python API...truncated for brevity.",
        "refusal": null,
        "role": "assistant",
        "function_call": null,
        "tool_calls": null
      },
      "content_filter_results": {
        "hate": {
          "filtered": false,
          "severity": "safe"
        },
        "protected_material_code": {
          "filtered": false,
          "detected": false
        },
        "protected_material_text": {
          "filtered": false,
          "detected": false
        },
        "self_harm": {
          "filtered": false,
          "severity": "safe"
        },
        "sexual": {
          "filtered": false,
          "severity": "safe"
        },
        "violence": {
          "filtered": false,
          "severity": "safe"
        }
      }
    }
  ],
  "created": 1728073417,
  "model": "o1-2024-12-17",
  "object": "chat.completion",
  "service_tier": null,
  "system_fingerprint": "fp_503a95a7d8",
  "usage": {
    "completion_tokens": 1843,
    "prompt_tokens": 20,
    "total_tokens": 1863,
    "completion_tokens_details": {
      "audio_tokens": null,
      "reasoning_tokens": 448
    },
    "prompt_tokens_details": {
      "audio_tokens": null,
      "cached_tokens": 0
    }
  },
  "prompt_filter_results": [
    {
      "prompt_index": 0,
      "content_filter_results": {
        "custom_blocklists": {
          "filtered": false
        },
        "hate": {
          "filtered": false,
          "severity": "safe"
        },
        "jailbreak": {
          "filtered": false,
          "detected": false
        },
        "self_harm": {
          "filtered": false,
          "severity": "safe"
        },
        "sexual": {
          "filtered": false,
          "severity": "safe"
        },
        "violence": {
          "filtered": false,
          "severity": "safe"
        }
      }
    }
  ]
}
```

## Reasoning effort

Note

Reasoning models have `reasoning_tokens` as part of `completion_tokens_details` in the model response. These are hidden tokens that aren't returned as part of the message response content but are used by the model to help generate a final answer to your request. `2024-12-01-preview` adds an additional new parameter `reasoning_effort` which can be set to `low`, `medium`, or `high` with the latest `o1` model. The higher the effort setting, the longer the model will spend processing the request, which will generally result in a larger number of `reasoning_tokens`.

## Developer messages

Functionally developer messages `"role": "developer"` are the same as system messages.

Adding a developer message to the previous code example would look as follows:

- [Python (Microsoft Entra ID)](#tabpanel_2_python-secure)
- [Python (key-based auth)](#tabpanel_2_python)
- [C#](#tabpanel_2_csharp)

You might need to upgrade your version of the OpenAI Python library to take advantage of the new parameters like `max_completion_tokens`.

```bash
pip install openai --upgrade
```

```python

from openai import AzureOpenAI

client = AzureOpenAI(
  azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT"), 
  api_key=os.getenv("AZURE_OPENAI_API_KEY"),  
  api_version="2025-03-01-preview"
)

response = client.chat.completions.create(
    model="o1-new", # replace with the model deployment name of your o1 deployment.
    messages=[
        {"role": "developer","content": "You are a helpful assistant."}, # optional equivalent to a system message for reasoning models 
        {"role": "user", "content": "What steps should I think about when writing my first Python API?"},
    ],
    max_completion_tokens = 5000,
    reasoning_effort = "medium" # low, medium, or high
)

print(response.model_dump_json(indent=2))
```

## Reasoning summary

When using the latest `o3` and `o4-mini` models with the [Responses API](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/responses) you can use the reasoning summary parameter to receive summaries of the model's chain of thought reasoning. This parameter can be set to `auto`, `concise`, or `detailed`. Access to this feature requires you to [Request Access](https://aka.ms/oai/o3access).

Note

Even when enabled, reasoning summaries are not generated for every step/request. This is expected behavior.

- [Python](#tabpanel_3_py)
- [REST](#tabpanel_3_REST)

You'll need to upgrade your OpenAI client library for access to the latest parameters.

```bash
pip install openai --upgrade
```

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
)

client = AzureOpenAI(
  azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT"), 
  azure_ad_token_provider=token_provider,
  api_version="2025-04-01-preview" # You must use this version or greater to access reasoning summary
)

response = client.responses.create(
    input="Tell me about the curious case of neural text degeneration",
    model="o4-mini", # replace with model deployment name
    reasoning={
        "effort": "medium",
        "summary": "detailed" # auto, concise, or detailed (currently only supported with o4-mini and o3)
    }
)

print(response.model_dump_json(indent=2))
```

```json
{
  "id": "resp_68007e26b2cc8190b83361014f3a78c50ae9b88522c3ad24",
  "created_at": 1744862758.0,
  "error": null,
  "incomplete_details": null,
  "instructions": null,
  "metadata": {},
  "model": "o4-mini",
  "object": "response",
  "output": [
    {
      "id": "rs_68007e2773bc8190b5b8089949bfe13a0ae9b88522c3ad24",
      "summary": [
        {
          "text": "**Summarizing neural text degeneration**\n\nThe user's asking about \"The Curious Case of Neural Text Degeneration,\" a paper by Ari Holtzman et al. from 2020. It explains how certain decoding strategies produce repetitive and dull text. In contrast, methods like nucleus sampling yield more coherent and diverse outputs. The authors introduce metrics like surprisal and distinct-n for evaluation and suggest that maximum likelihood decoding often favors generic continuations, leading to loops and repetitive patterns in longer texts. They promote sampling from truncated distributions for improved text quality.",
          "type": "summary_text"
        },
        {
          "text": "**Explaining nucleus sampling**\n\nThe authors propose nucleus sampling, which captures a specified mass of the predictive distribution, improving metrics such as coherence and diversity. They identify a \"sudden drop\" phenomenon in token probabilities, where a few tokens dominate, leading to a long tail. By truncating this at a cumulative probability threshold, they aim to enhance text quality compared to top-k sampling. Their evaluations include human assessments, showing better results in terms of BLEU scores and distinct-n measures. Overall, they highlight how decoding strategies influence quality and recommend adaptive techniques for improved outcomes.",
          "type": "summary_text"
        }
      ],
      "type": "reasoning",
      "status": null
    },
    {
      "id": "msg_68007e35c44881908cb4651b8e9972300ae9b88522c3ad24",
      "content": [
        {
          "annotations": [],
          "text": "Researchers first became aware that neural language models, when used to generate long stretches of text with standard “maximum‐likelihood” decoding (greedy search, beam search, etc.), often produce bland, repetitive or looping output. The 2020 paper “The Curious Case of Neural Text Degeneration” (Holtzman et al.) analyzes this failure mode and proposes a simple fix—nucleus (top‑p) sampling—that dramatically improves output quality.\n\n1. The Problem: Degeneration  \n   • With greedy or beam search, models tend to pick very high‑probability tokens over and over, leading to loops (“the the the…”) or generic, dull continuations.  \n   • Even sampling with a fixed top‑k (e.g. always sample from the 40 most likely tokens) can be suboptimal: if the model’s probability mass is skewed, k may be too small (overly repetitive) or too large (introducing incoherence).\n\n2. Why It Happens: Distributional Peakedness  \n   • At each time step the model’s predicted next‐token distribution often has one or two very high‑probability tokens, then a long tail of low‑probability tokens.  \n   • Maximum‐likelihood decoding zeroes in on the peak, collapsing diversity.  \n   • Uniform sampling over a large k allows low‑probability “wild” tokens, harming coherence.\n\n3. The Fix: Nucleus (Top‑p) Sampling  \n   • Rather than fixing k, dynamically truncate the distribution to the smallest set of tokens whose cumulative probability ≥ p (e.g. p=0.9).  \n   • Then renormalize and sample from that “nucleus.”  \n   • This keeps only the “plausible” mass and discards the improbable tail, adapting to each context.\n\n4. Empirical Findings  \n   • Automatic metrics (distinct‑n, repetition rates) and human evaluations show nucleus sampling yields more diverse, coherent, on‑topic text than greedy/beam or fixed top‑k.  \n   • It also outperforms simple temperature scaling (raising logits to 1/T) because it adapts to changes in the distribution’s shape.\n\n5. Takeaways for Practitioners  \n   • Don’t default to beam search for open-ended generation—its high likelihood doesn’t mean high quality.  \n   • Use nucleus sampling (p between 0.8 and 0.95) for a balance of diversity and coherence.  \n   • Monitor repetition and distinct‑n scores if you need automatic sanity checks.\n\nIn short, “neural text degeneration” is the tendency of likelihood‐maximizing decoders to produce dull or looping text. By recognizing that the shape of the model’s probability distribution varies wildly from step to step, nucleus sampling provides an elegant, adaptive way to maintain both coherence and diversity in generated text.",
          "type": "output_text"
        }
      ],
      "role": "assistant",
      "status": "completed",
      "type": "message"
    }
  ],
  "parallel_tool_calls": true,
  "temperature": 1.0,
  "tool_choice": "auto",
  "tools": [],
  "top_p": 1.0,
  "max_output_tokens": null,
  "previous_response_id": null,
  "reasoning": {
    "effort": "medium",
    "generate_summary": null,
    "summary": "detailed"
  },
  "status": "completed",
  "text": {
    "format": {
      "type": "text"
    }
  },
  "truncation": "disabled",
  "usage": {
    "input_tokens": 16,
    "output_tokens": 974,
    "output_tokens_details": {
      "reasoning_tokens": 384
    },
    "total_tokens": 990,
    "input_tokens_details": {
      "cached_tokens": 0
    }
  },
  "user": null,
  "store": true
}
```

## Markdown output

By default the `o3-mini` and `o1` models will not attempt to produce output that includes markdown formatting. A common use case where this behavior is undesirable is when you want the model to output code contained within a markdown code block. When the model generates output without markdown formatting you lose features like syntax highlighting, and copyable code blocks in interactive playground experiences. To override this new default behavior and encourage markdown inclusion in model responses, add the string `Formatting re-enabled` to the beginning of your developer message.

Adding `Formatting re-enabled` to the beginning of your developer message does not guarantee that the model will include markdown formatting in its response, it only increases the likelihood. We have found from internal testing that `Formatting re-enabled` is less effective by itself with the `o1` model than with `o3-mini`.

To improve the performance of `Formatting re-enabled` you can further augment the beginning of the developer message which will often result in the desired output. Rather than just adding `Formatting re-enabled` to the beginning of your developer message, you can experiment with adding a more descriptive initial instruction like one of the examples below:

- `Formatting re-enabled - please enclose code blocks with appropriate markdown tags.`
- `Formatting re-enabled - code output should be wrapped in markdown.`

Depending on your expected output you may need to customize your initial developer message further to target your specific use case.