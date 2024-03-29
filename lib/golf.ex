defmodule Golf do
  @moduledoc """
  Golf keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  @doc """
  Generates a random 6 character id.
  https://gist.github.com/danschultzer/99c21ba403fd7f49a26cc40571ff5cce
  """
  def gen_id() do
    min = String.to_integer("100000", 36)
    max = String.to_integer("ZZZZZZ", 36)

    max
    |> Kernel.-(min)
    |> :rand.uniform()
    |> Kernel.+(min)
    |> Integer.to_string(36)
    |> String.downcase()
  end

  def subscribe!(topic) do
    :ok = Phoenix.PubSub.subscribe(Golf.PubSub, topic)
  end

  def broadcast!(topic, msg) do
    Phoenix.PubSub.broadcast!(Golf.PubSub, topic, msg)
  end
end
